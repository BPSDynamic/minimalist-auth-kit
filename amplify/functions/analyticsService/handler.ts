import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

interface AnalyticsEvent {
  userId: string;
  eventType: 'file_upload' | 'file_download' | 'file_share' | 'folder_create' | 'user_login' | 'storage_usage';
  eventData: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    folderName?: string;
    shareRecipients?: string[];
    downloadCount?: number;
    storageUsed?: number;
    storageLimit?: number;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
  };
}

interface AnalyticsQuery {
  userId: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  limit?: number;
}

interface AnalyticsReport {
  totalEvents: number;
  eventsByType: Record<string, number>;
  storageUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  topFiles: Array<{
    fileName: string;
    downloadCount: number;
  }>;
  recentActivity: Array<{
    eventType: string;
    timestamp: string;
    data: any;
  }>;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Analytics event:', JSON.stringify(event, null, 2));

  try {
    const httpMethod = event.httpMethod;
    const path = event.path;

    if (httpMethod === 'POST' && path.includes('/track')) {
      return await trackEvent(event);
    } else if (httpMethod === 'GET' && path.includes('/report')) {
      return await getAnalyticsReport(event);
    } else if (httpMethod === 'GET' && path.includes('/query')) {
      return await queryAnalytics(event);
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed',
        }),
      };
    }

  } catch (error) {
    console.error('Analytics error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    };
  }
};

async function trackEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as AnalyticsEvent;
  const { userId, eventType, eventData } = body;

  if (!userId || !eventType) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: 'Missing required parameters: userId, eventType',
      }),
    };
  }

  const analyticsRecord = {
    id: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    eventType,
    eventData: {
      ...eventData,
      timestamp: eventData.timestamp || new Date().toISOString(),
      ipAddress: event.requestContext?.identity?.sourceIp || 'unknown',
      userAgent: event.headers?.['User-Agent'] || 'unknown',
    },
    createdAt: new Date().toISOString(),
  };

  try {
    await dynamoClient.send(new PutCommand({
      TableName: process.env.ANALYTICS_TABLE || 'Analytics',
      Item: analyticsRecord,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        message: 'Event tracked successfully',
        eventId: analyticsRecord.id,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track event',
      }),
    };
  }
}

async function getAnalyticsReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: 'Missing required parameter: userId',
      }),
    };
  }

  try {
    // Get all events for the user
    const events = await dynamoClient.send(new QueryCommand({
      TableName: process.env.ANALYTICS_TABLE || 'Analytics',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Most recent first
      Limit: 1000,
    }));

    const eventsList = events.Items || [];
    
    // Generate analytics report
    const report = generateAnalyticsReport(eventsList);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        report,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      }),
    };
  }
}

async function queryAnalytics(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.queryStringParameters?.userId;
  const eventType = event.queryStringParameters?.eventType;
  const startDate = event.queryStringParameters?.startDate;
  const endDate = event.queryStringParameters?.endDate;
  const limit = parseInt(event.queryStringParameters?.limit || '100');

  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: 'Missing required parameter: userId',
      }),
    };
  }

  try {
    let filterExpression = 'userId = :userId';
    const expressionAttributeValues: any = { ':userId': userId };

    if (eventType) {
      filterExpression += ' AND eventType = :eventType';
      expressionAttributeValues[':eventType'] = eventType;
    }

    if (startDate) {
      filterExpression += ' AND createdAt >= :startDate';
      expressionAttributeValues[':startDate'] = startDate;
    }

    if (endDate) {
      filterExpression += ' AND createdAt <= :endDate';
      expressionAttributeValues[':endDate'] = endDate;
    }

    const result = await dynamoClient.send(new ScanCommand({
      TableName: process.env.ANALYTICS_TABLE || 'Analytics',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        events: result.Items || [],
        count: result.Count || 0,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query analytics',
      }),
    };
  }
}

function generateAnalyticsReport(events: any[]): AnalyticsReport {
  const totalEvents = events.length;
  const eventsByType: Record<string, number> = {};
  let storageUsed = 0;
  let storageLimit = 0;
  const fileDownloads: Record<string, number> = {};
  const recentActivity: any[] = [];

  events.forEach(event => {
    // Count events by type
    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

    // Calculate storage usage
    if (event.eventType === 'file_upload' && event.eventData.fileSize) {
      storageUsed += event.eventData.fileSize;
    }
    if (event.eventData.storageLimit) {
      storageLimit = event.eventData.storageLimit;
    }

    // Track file downloads
    if (event.eventType === 'file_download' && event.eventData.fileName) {
      fileDownloads[event.eventData.fileName] = (fileDownloads[event.eventData.fileName] || 0) + 1;
    }

    // Add to recent activity (last 10 events)
    if (recentActivity.length < 10) {
      recentActivity.push({
        eventType: event.eventType,
        timestamp: event.eventData.timestamp,
        data: event.eventData,
      });
    }
  });

  // Get top files by download count
  const topFiles = Object.entries(fileDownloads)
    .map(([fileName, downloadCount]) => ({ fileName, downloadCount }))
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 5);

  return {
    totalEvents,
    eventsByType,
    storageUsage: {
      used: storageUsed,
      limit: storageLimit,
      percentage: storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0,
    },
    topFiles,
    recentActivity,
  };
}
