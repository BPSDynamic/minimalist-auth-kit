import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface FileUploadRequest {
  userEmail: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  folderId?: string;
  tags?: string[];
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  importance: 'low' | 'medium' | 'high' | 'critical';
  allowSharing: boolean;
}

interface FileData {
  id: string;
  userEmail: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  folderId?: string;
  tags: string[];
  confidentiality: string;
  importance: string;
  allowSharing: boolean;
  createdAt: string;
  updatedAt: string;
  s3Key: string;
  downloadCount: number;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('File service event:', JSON.stringify(event, null, 2));

  try {
    const httpMethod = event.httpMethod;
    const path = event.path;

    if (httpMethod === 'POST' && path.includes('/upload')) {
      return await uploadFile(event);
    } else if (httpMethod === 'GET' && path.includes('/list')) {
      return await listFiles(event);
    } else if (httpMethod === 'DELETE' && path.includes('/delete')) {
      return await deleteFile(event);
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
    console.error('File service error:', error);
    
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

async function uploadFile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as FileUploadRequest;
  const { userEmail, userId, fileName, fileSize, fileType, folderId, tags, confidentiality, importance, allowSharing } = body;

  if (!userEmail || !userId || !fileName || !fileSize || !fileType) {
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
        error: 'Missing required parameters: userEmail, userId, fileName, fileSize, fileType',
      }),
    };
  }

  try {
    const fileId = uuidv4();
    const timestamp = new Date().toISOString();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `user-files/${userEmail}/files/${sanitizedFileName}_${fileId}`;

    // Create file data for DynamoDB
    const fileData: FileData = {
      id: fileId,
      userEmail,
      userId,
      fileName,
      fileSize,
      fileType,
      folderId,
      tags: tags || [],
      confidentiality,
      importance,
      allowSharing,
      createdAt: timestamp,
      updatedAt: timestamp,
      s3Key,
      downloadCount: 0,
    };

    // Save file metadata to DynamoDB
    await dynamoClient.send(new PutCommand({
      TableName: process.env.FILES_TABLE || 'Files',
      Item: fileData,
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
        fileId: fileId,
        s3Key: s3Key,
        message: 'File metadata created successfully',
      }),
    };

  } catch (error) {
    console.error('Upload file error:', error);
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
        error: error instanceof Error ? error.message : 'Failed to upload file',
      }),
    };
  }
}

async function listFiles(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userEmail = event.queryStringParameters?.userEmail;
  const folderId = event.queryStringParameters?.folderId;

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
    let result;

    if (folderId) {
      // Query files by userEmail and folderId
      result = await dynamoClient.send(new QueryCommand({
        TableName: process.env.FILES_TABLE || 'Files',
        KeyConditionExpression: 'userEmail = :userEmail',
        FilterExpression: 'folderId = :folderId',
        ExpressionAttributeValues: {
          ':userEmail': userEmail,
          ':folderId': folderId,
        },
        ScanIndexForward: false, // Most recent first
      }));
    } else {
      // Query all files for user
      result = await dynamoClient.send(new QueryCommand({
        TableName: process.env.FILES_TABLE || 'Files',
        KeyConditionExpression: 'userEmail = :userEmail',
        ExpressionAttributeValues: {
          ':userEmail': userEmail,
        },
        ScanIndexForward: false, // Most recent first
      }));
    }

    const files = result.Items || [];

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
        files: files,
        count: files.length,
      }),
    };

  } catch (error) {
    console.error('List files error:', error);
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
        error: error instanceof Error ? error.message : 'Failed to list files',
      }),
    };
  }
}

async function deleteFile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { userEmail, fileId } = body;

  if (!userEmail || !fileId) {
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
        error: 'Missing required parameters: userEmail, fileId',
      }),
    };
  }

  try {
    // First, get the file to find its S3 key
    const fileResult = await dynamoClient.send(new QueryCommand({
      TableName: process.env.FILES_TABLE || 'Files',
      KeyConditionExpression: 'userEmail = :userEmail AND id = :fileId',
      ExpressionAttributeValues: {
        ':userEmail': userEmail,
        ':fileId': fileId,
      },
    }));

    if (!fileResult.Items || fileResult.Items.length === 0) {
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
          error: 'File not found',
        }),
      };
    }

    const file = fileResult.Items[0] as FileData;

    // Delete file from DynamoDB
    await dynamoClient.send(new DeleteCommand({
      TableName: process.env.FILES_TABLE || 'Files',
      Key: {
        userEmail: userEmail,
        id: fileId,
      },
    }));

    // Delete file from S3
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: file.s3Key,
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
        message: 'File deleted successfully',
      }),
    };

  } catch (error) {
    console.error('Delete file error:', error);
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
        error: error instanceof Error ? error.message : 'Failed to delete file',
      }),
    };
  }
}
