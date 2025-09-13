import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface BackupEvent {
  action: 'backup' | 'restore' | 'cleanup' | 'verify';
  userId?: string;
  fileId?: string;
  backupId?: string;
  targetRegion?: string;
}

interface BackupResult {
  success: boolean;
  backupId?: string;
  filesBackedUp?: number;
  filesRestored?: number;
  filesDeleted?: number;
  error?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Backup event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}') as BackupEvent;
    const { action } = body;

    if (!action) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameter: action',
        }),
      };
    }

    let result: BackupResult;

    switch (action) {
      case 'backup':
        result = await performBackup(body);
        break;
      case 'restore':
        result = await performRestore(body);
        break;
      case 'cleanup':
        result = await performCleanup(body);
        break;
      case 'verify':
        result = await verifyBackup(body);
        break;
      default:
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
          body: JSON.stringify({
            success: false,
            error: 'Invalid action. Supported actions: backup, restore, cleanup, verify',
          }),
        };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Backup error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    };
  }
};

async function performBackup(event: BackupEvent): Promise<BackupResult> {
  const { userId, targetRegion } = event;
  const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const sourceBucket = process.env.SOURCE_BUCKET!;
    const backupBucket = process.env.BACKUP_BUCKET!;
    
    // List all objects in source bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: sourceBucket,
      Prefix: userId ? `user-files/${userId}/` : '',
    });

    const listResult = await s3Client.send(listCommand);
    const objects = listResult.Contents || [];
    
    let filesBackedUp = 0;
    const backupPromises = objects.map(async (obj) => {
      if (!obj.Key) return;
      
      const copyCommand = new CopyObjectCommand({
        Bucket: backupBucket,
        CopySource: `${sourceBucket}/${obj.Key}`,
        Key: `backups/${backupId}/${obj.Key}`,
        Metadata: {
          originalKey: obj.Key,
          backupId: backupId,
          backupDate: new Date().toISOString(),
          originalSize: obj.Size?.toString() || '0',
        },
        MetadataDirective: 'REPLACE',
      });

      await s3Client.send(copyCommand);
      filesBackedUp++;
    });

    await Promise.all(backupPromises);

    return {
      success: true,
      backupId,
      filesBackedUp,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Backup failed',
    };
  }
}

async function performRestore(event: BackupEvent): Promise<BackupResult> {
  const { backupId, userId } = event;
  
  if (!backupId) {
    return {
      success: false,
      error: 'Backup ID is required for restore operation',
    };
  }

  try {
    const sourceBucket = process.env.SOURCE_BUCKET!;
    const backupBucket = process.env.BACKUP_BUCKET!;
    
    // List all objects in backup
    const listCommand = new ListObjectsV2Command({
      Bucket: backupBucket,
      Prefix: `backups/${backupId}/`,
    });

    const listResult = await s3Client.send(listCommand);
    const objects = listResult.Contents || [];
    
    let filesRestored = 0;
    const restorePromises = objects.map(async (obj) => {
      if (!obj.Key) return;
      
      // Extract original key from backup path
      const originalKey = obj.Key.replace(`backups/${backupId}/`, '');
      
      const copyCommand = new CopyObjectCommand({
        Bucket: sourceBucket,
        CopySource: `${backupBucket}/${obj.Key}`,
        Key: originalKey,
      });

      await s3Client.send(copyCommand);
      filesRestored++;
    });

    await Promise.all(restorePromises);

    return {
      success: true,
      filesRestored,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Restore failed',
    };
  }
}

async function performCleanup(event: BackupEvent): Promise<BackupResult> {
  try {
    const backupBucket = process.env.BACKUP_BUCKET!;
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // List all backup folders
    const listCommand = new ListObjectsV2Command({
      Bucket: backupBucket,
      Prefix: 'backups/',
      Delimiter: '/',
    });

    const listResult = await s3Client.send(listCommand);
    const backupFolders = listResult.CommonPrefixes || [];
    
    let filesDeleted = 0;
    const deletePromises = backupFolders.map(async (folder) => {
      if (!folder.Prefix) return;
      
      // Extract backup ID from folder path
      const backupId = folder.Prefix.replace('backups/', '').replace('/', '');
      const backupDate = new Date(parseInt(backupId.split('-')[1]));
      
      // Delete if older than retention period
      if (backupDate < cutoffDate) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: backupBucket,
          Key: folder.Prefix,
        });

        await s3Client.send(deleteCommand);
        filesDeleted++;
      }
    });

    await Promise.all(deletePromises);

    return {
      success: true,
      filesDeleted,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    };
  }
}

async function verifyBackup(event: BackupEvent): Promise<BackupResult> {
  const { backupId } = event;
  
  if (!backupId) {
    return {
      success: false,
      error: 'Backup ID is required for verify operation',
    };
  }

  try {
    const sourceBucket = process.env.SOURCE_BUCKET!;
    const backupBucket = process.env.BACKUP_BUCKET!;
    
    // List objects in source bucket
    const sourceListCommand = new ListObjectsV2Command({
      Bucket: sourceBucket,
    });

    const sourceResult = await s3Client.send(sourceListCommand);
    const sourceObjects = sourceResult.Contents || [];
    
    // List objects in backup
    const backupListCommand = new ListObjectsV2Command({
      Bucket: backupBucket,
      Prefix: `backups/${backupId}/`,
    });

    const backupResult = await s3Client.send(backupListCommand);
    const backupObjects = backupResult.Contents || [];
    
    // Verify backup integrity
    const sourceMap = new Map(sourceObjects.map(obj => [obj.Key, obj.Size]));
    const backupMap = new Map(backupObjects.map(obj => [obj.Key?.replace(`backups/${backupId}/`, ''), obj.Size]));
    
    let verified = true;
    const issues: string[] = [];
    
    for (const [key, size] of sourceMap) {
      if (!backupMap.has(key)) {
        verified = false;
        issues.push(`Missing file in backup: ${key}`);
      } else if (backupMap.get(key) !== size) {
        verified = false;
        issues.push(`Size mismatch for file: ${key}`);
      }
    }

    return {
      success: verified,
      error: verified ? undefined : `Backup verification failed: ${issues.join(', ')}`,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}
