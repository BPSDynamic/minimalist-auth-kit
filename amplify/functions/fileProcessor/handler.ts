import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createHash } from 'crypto';
import * as sharp from 'sharp';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

interface FileProcessingEvent {
  bucket: string;
  key: string;
  userId: string;
  fileId: string;
}

interface ProcessingResult {
  success: boolean;
  metadata?: {
    fileSize: number;
    mimeType: string;
    hash: string;
    dimensions?: { width: number; height: number };
    exifData?: any;
    thumbnailUrl?: string;
  };
  error?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('File processing event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}') as FileProcessingEvent;
    const { bucket, key, userId, fileId } = body;

    if (!bucket || !key || !userId || !fileId) {
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
          error: 'Missing required parameters: bucket, key, userId, fileId',
        }),
      };
    }

    // Download file from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const s3Object = await s3Client.send(getObjectCommand);
    const fileBuffer = await streamToBuffer(s3Object.Body as NodeJS.ReadableStream);

    // Process file
    const result = await processFile(fileBuffer, key);

    if (result.success && result.metadata) {
      // Generate thumbnail for images
      if (result.metadata.mimeType.startsWith('image/')) {
        try {
          const thumbnailBuffer = await generateThumbnail(fileBuffer);
          const thumbnailKey = `thumbnails/${fileId}.jpg`;
          
          await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            Metadata: {
              originalFile: key,
              userId: userId,
            },
          }));

          result.metadata.thumbnailUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;
        } catch (error) {
          console.warn('Thumbnail generation failed:', error);
        }
      }

      // Update file metadata in DynamoDB
      await updateFileMetadata(fileId, result.metadata);
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
    console.error('File processing error:', error);
    
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

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function processFile(fileBuffer: Buffer, fileName: string): Promise<ProcessingResult> {
  try {
    // Calculate file hash
    const hash = createHash('sha256').update(fileBuffer).digest('hex');
    
    // Detect MIME type
    const mimeType = detectMimeType(fileName, fileBuffer);
    
    // Get file dimensions for images
    let dimensions: { width: number; height: number } | undefined;
    if (mimeType.startsWith('image/')) {
      try {
        const metadata = await sharp(fileBuffer).metadata();
        dimensions = {
          width: metadata.width || 0,
          height: metadata.height || 0,
        };
      } catch (error) {
        console.warn('Could not extract image dimensions:', error);
      }
    }

    // Extract EXIF data for images
    let exifData: any;
    if (mimeType.startsWith('image/')) {
      try {
        const metadata = await sharp(fileBuffer).metadata();
        exifData = metadata.exif ? JSON.parse(metadata.exif.toString()) : null;
      } catch (error) {
        console.warn('Could not extract EXIF data:', error);
      }
    }

    return {
      success: true,
      metadata: {
        fileSize: fileBuffer.length,
        mimeType,
        hash,
        dimensions,
        exifData,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File processing failed',
    };
  }
}

async function generateThumbnail(fileBuffer: Buffer): Promise<Buffer> {
  return await sharp(fileBuffer)
    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

function detectMimeType(fileName: string, fileBuffer: Buffer): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Check file signature (magic numbers)
  const signature = fileBuffer.slice(0, 4);
  
  if (signature[0] === 0xFF && signature[1] === 0xD8) return 'image/jpeg';
  if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) return 'image/png';
  if (signature[0] === 0x47 && signature[1] === 0x49 && signature[2] === 0x46) return 'image/gif';
  if (signature[0] === 0x52 && signature[1] === 0x49 && signature[2] === 0x46 && signature[3] === 0x46) return 'image/webp';
  
  // Fallback to extension-based detection
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

async function updateFileMetadata(fileId: string, metadata: any): Promise<void> {
  const updateCommand = new UpdateCommand({
    TableName: process.env.FILES_TABLE_NAME || 'Files',
    Key: { id: fileId },
    UpdateExpression: 'SET #metadata = :metadata, #processedAt = :processedAt',
    ExpressionAttributeNames: {
      '#metadata': 'metadata',
      '#processedAt': 'processedAt',
    },
    ExpressionAttributeValues: {
      ':metadata': metadata,
      ':processedAt': new Date().toISOString(),
    },
  });

  await dynamoClient.send(updateCommand);
}
