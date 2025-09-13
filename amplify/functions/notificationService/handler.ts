import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const sesClient = new SESClient({ region: process.env.SES_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

interface NotificationEvent {
  type: 'file_shared' | 'file_uploaded' | 'file_downloaded' | 'folder_created' | 'security_alert';
  userId: string;
  userEmail: string;
  userName: string;
  data: {
    fileName?: string;
    folderName?: string;
    shareLink?: string;
    recipients?: string[];
    message?: string;
    downloadCount?: number;
    securityEvent?: string;
  };
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Notification event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}') as NotificationEvent;
    const { type, userId, userEmail, userName, data } = body;

    if (!type || !userId || !userEmail || !userName) {
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
          error: 'Missing required parameters: type, userId, userEmail, userName',
        }),
      };
    }

    let result: NotificationResult;

    switch (type) {
      case 'file_shared':
        result = await sendFileSharedNotification(userEmail, userName, data);
        break;
      case 'file_uploaded':
        result = await sendFileUploadedNotification(userEmail, userName, data);
        break;
      case 'file_downloaded':
        result = await sendFileDownloadedNotification(userEmail, userName, data);
        break;
      case 'folder_created':
        result = await sendFolderCreatedNotification(userEmail, userName, data);
        break;
      case 'security_alert':
        result = await sendSecurityAlertNotification(userEmail, userName, data);
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
            error: 'Invalid notification type',
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
    console.error('Notification error:', error);
    
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

async function sendFileSharedNotification(
  userEmail: string,
  userName: string,
  data: NotificationEvent['data']
): Promise<NotificationResult> {
  const { fileName, shareLink, recipients, message } = data;

  const emailContent = `
    <html>
      <body>
        <h2>File Shared Successfully</h2>
        <p>Hello ${userName},</p>
        <p>Your file "${fileName}" has been shared successfully.</p>
        <p><strong>Share Link:</strong> <a href="${shareLink}">${shareLink}</a></p>
        <p><strong>Recipients:</strong> ${recipients?.join(', ') || 'N/A'}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p>Best regards,<br>CloudVault Team</p>
      </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: 'noreply@cloudvault.com',
    Destination: {
      ToAddresses: [userEmail],
    },
    Message: {
      Subject: {
        Data: 'File Shared Successfully - CloudVault',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: emailContent,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

async function sendFileUploadedNotification(
  userEmail: string,
  userName: string,
  data: NotificationEvent['data']
): Promise<NotificationResult> {
  const { fileName } = data;

  const emailContent = `
    <html>
      <body>
        <h2>File Uploaded Successfully</h2>
        <p>Hello ${userName},</p>
        <p>Your file "${fileName}" has been uploaded and processed successfully.</p>
        <p>You can now access it from your CloudVault dashboard.</p>
        <p>Best regards,<br>CloudVault Team</p>
      </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: 'noreply@cloudvault.com',
    Destination: {
      ToAddresses: [userEmail],
    },
    Message: {
      Subject: {
        Data: 'File Uploaded Successfully - CloudVault',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: emailContent,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

async function sendFileDownloadedNotification(
  userEmail: string,
  userName: string,
  data: NotificationEvent['data']
): Promise<NotificationResult> {
  const { fileName, downloadCount } = data;

  const emailContent = `
    <html>
      <body>
        <h2>File Downloaded</h2>
        <p>Hello ${userName},</p>
        <p>Your shared file "${fileName}" has been downloaded ${downloadCount || 1} time(s).</p>
        <p>You can view more analytics in your CloudVault dashboard.</p>
        <p>Best regards,<br>CloudVault Team</p>
      </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: 'noreply@cloudvault.com',
    Destination: {
      ToAddresses: [userEmail],
    },
    Message: {
      Subject: {
        Data: 'File Downloaded - CloudVault',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: emailContent,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

async function sendFolderCreatedNotification(
  userEmail: string,
  userName: string,
  data: NotificationEvent['data']
): Promise<NotificationResult> {
  const { folderName } = data;

  const emailContent = `
    <html>
      <body>
        <h2>Folder Created Successfully</h2>
        <p>Hello ${userName},</p>
        <p>Your folder "${folderName}" has been created successfully.</p>
        <p>You can now organize your files in this folder.</p>
        <p>Best regards,<br>CloudVault Team</p>
      </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: 'noreply@cloudvault.com',
    Destination: {
      ToAddresses: [userEmail],
    },
    Message: {
      Subject: {
        Data: 'Folder Created Successfully - CloudVault',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: emailContent,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

async function sendSecurityAlertNotification(
  userEmail: string,
  userName: string,
  data: NotificationEvent['data']
): Promise<NotificationResult> {
  const { securityEvent } = data;

  const emailContent = `
    <html>
      <body>
        <h2>Security Alert</h2>
        <p>Hello ${userName},</p>
        <p>A security event has been detected in your CloudVault account:</p>
        <p><strong>Event:</strong> ${securityEvent}</p>
        <p>If you did not perform this action, please contact support immediately.</p>
        <p>Best regards,<br>CloudVault Security Team</p>
      </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: 'security@cloudvault.com',
    Destination: {
      ToAddresses: [userEmail],
    },
    Message: {
      Subject: {
        Data: 'Security Alert - CloudVault',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: emailContent,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
