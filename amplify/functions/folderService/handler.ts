import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface FolderCreateRequest {
  userEmail: string;
  userId: string;
  folderName: string;
  parentFolderId?: string;
  allowedFileTypes: string[];
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  importance: 'low' | 'medium' | 'high' | 'critical';
  allowSharing: boolean;
}

interface FolderData {
  id: string;
  userEmail: string;
  userId: string;
  name: string;
  parentId?: string;
  allowedFileTypes: string[];
  confidentiality: string;
  importance: string;
  allowSharing: boolean;
  createdAt: string;
  updatedAt: string;
  s3Key: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Folder service event:', JSON.stringify(event, null, 2));

  try {
    const httpMethod = event.httpMethod;
    const path = event.path;

    if (httpMethod === 'POST' && path.includes('/create')) {
      return await createFolder(event);
    } else if (httpMethod === 'GET' && path.includes('/list')) {
      return await listFolders(event);
    } else if (httpMethod === 'DELETE' && path.includes('/delete')) {
      return await deleteFolder(event);
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        },
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed',
        }),
      };
    }

  } catch (error) {
    console.error('Folder service error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    };
  }
};

async function createFolder(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as FolderCreateRequest;
  const { userEmail, userId, folderName, parentFolderId, allowedFileTypes, confidentiality, importance, allowSharing } = body;

  if (!userEmail || !userId || !folderName) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: 'Missing required parameters: userEmail, userId, folderName',
      }),
    };
  }

  try {
    const folderId = uuidv4();
    const timestamp = new Date().toISOString();
    const sanitizedName = folderName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const s3Key = `user-files/${userEmail}/folders/${sanitizedName}_${folderId}/.folder_placeholder`;

    // Create folder data for DynamoDB
    const folderData: FolderData = {
      id: folderId,
      userEmail,
      userId,
      name: folderName,
      parentId: parentFolderId,
      allowedFileTypes,
      confidentiality,
      importance,
      allowSharing,
      createdAt: timestamp,
      updatedAt: timestamp,
      s3Key,
    };

    // Save folder metadata to DynamoDB
    await dynamoClient.send(new PutCommand({
      TableName: process.env.FOLDERS_TABLE || 'Folders',
      Item: folderData,
    }));

    // Create folder placeholder in S3
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: s3Key,
      Body: JSON.stringify({
        type: 'folder',
        name: folderName,
        createdAt: timestamp,
        metadata: folderData,
      }),
      ContentType: 'application/json',
      Metadata: {
        folderId: folderId,
        userEmail: userEmail,
        folderName: folderName,
      },
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        folderId: folderId,
        message: 'Folder created successfully',
      }),
    };

  } catch (error) {
    console.error('Create folder error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      }),
    };
  }
}

async function listFolders(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userEmail = event.queryStringParameters?.userEmail;

  if (!userEmail) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: 'Missing required parameter: userEmail',
      }),
    };
  }

  try {
    // Query folders by userEmail (partition key)
    const result = await dynamoClient.send(new QueryCommand({
      TableName: process.env.FOLDERS_TABLE || 'Folders',
      KeyConditionExpression: 'userEmail = :userEmail',
      ExpressionAttributeValues: {
        ':userEmail': userEmail,
      },
      ScanIndexForward: false, // Most recent first
    }));

    const folders = result.Items || [];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        folders: folders,
        count: folders.length,
      }),
    };

  } catch (error) {
    console.error('List folders error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list folders',
      }),
    };
  }
}

async function deleteFolder(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { userEmail, folderId } = body;

  if (!userEmail || !folderId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: 'Missing required parameters: userEmail, folderId',
      }),
    };
  }

  try {
    // First, get the folder to find its S3 key
    const folderResult = await dynamoClient.send(new QueryCommand({
      TableName: process.env.FOLDERS_TABLE || 'Folders',
      KeyConditionExpression: 'userEmail = :userEmail AND id = :folderId',
      ExpressionAttributeValues: {
        ':userEmail': userEmail,
        ':folderId': folderId,
      },
    }));

    if (!folderResult.Items || folderResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        },
        body: JSON.stringify({
          success: false,
          error: 'Folder not found',
        }),
      };
    }

    const folder = folderResult.Items[0] as FolderData;

    // Delete folder from DynamoDB
    await dynamoClient.send(new DeleteCommand({
      TableName: process.env.FOLDERS_TABLE || 'Folders',
      Key: {
        userEmail: userEmail,
        id: folderId,
      },
    }));

    // Delete folder placeholder from S3
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: folder.s3Key,
    }));

    // Also delete any files in this folder from S3 and DynamoDB
    // This is a simplified version - in production, you'd want to handle this more carefully
    try {
      const filesResult = await dynamoClient.send(new QueryCommand({
        TableName: process.env.FILES_TABLE || 'Files',
        KeyConditionExpression: 'userEmail = :userEmail',
        FilterExpression: 'folderId = :folderId',
        ExpressionAttributeValues: {
          ':userEmail': userEmail,
          ':folderId': folderId,
        },
      }));

      // Delete files from S3 and DynamoDB
      for (const file of filesResult.Items || []) {
        if (file.s3Key) {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME!,
            Key: file.s3Key,
          }));
        }

        await dynamoClient.send(new DeleteCommand({
          TableName: process.env.FILES_TABLE || 'Files',
          Key: {
            userEmail: userEmail,
            id: file.id,
          },
        }));
      }
    } catch (fileDeleteError) {
      console.warn('Error deleting files in folder:', fileDeleteError);
      // Continue with folder deletion even if file deletion fails
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        message: 'Folder deleted successfully',
      }),
    };

  } catch (error) {
    console.error('Delete folder error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete folder',
      }),
    };
  }
}
