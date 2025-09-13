import { Amplify } from 'aws-amplify';

// Safely import and configure Amplify
let amplify_outputs: any = {};
try {
  amplify_outputs = require('../../amplify_outputs.json');
  Amplify.configure(amplify_outputs);
} catch (error) {
  console.warn('Could not load amplify_outputs.json, using fallback configuration');
  // Use a minimal configuration for development
  amplify_outputs = {
    custom: {}
  };
}

export interface FileProcessingRequest {
  bucket: string;
  key: string;
  userId: string;
  fileId: string;
}

export interface FileProcessingResponse {
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

export interface NotificationRequest {
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

export interface AnalyticsRequest {
  userId: string;
  userEmail: string;
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

export interface FolderCreateRequest {
  userEmail: string;
  userId: string;
  folderName: string;
  parentFolderId?: string;
  allowedFileTypes: string[];
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  importance: 'low' | 'medium' | 'high' | 'critical';
  allowSharing: boolean;
}

export interface FolderCreateResponse {
  success: boolean;
  folderId?: string;
  error?: string;
}

export interface FileUploadRequest {
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

export interface BackupRequest {
  action: 'backup' | 'restore' | 'cleanup' | 'verify';
  userId?: string;
  fileId?: string;
  backupId?: string;
  targetRegion?: string;
}

export class LambdaService {
  private baseUrl: string;
  private isDeployed: boolean = false;

  constructor() {
    // Check if we have actual API Gateway URLs from amplify_outputs
    this.baseUrl = this.getApiGatewayUrl();
    this.isDeployed = this.baseUrl !== 'https://your-api-gateway-url.amazonaws.com/prod';
  }

  private getApiGatewayUrl(): string {
    try {
      // Try to get the actual API Gateway URL from amplify_outputs
      if (amplify_outputs?.custom?.folderService?.apiGatewayUrl) {
        return amplify_outputs.custom.folderService.apiGatewayUrl;
      }
      if (amplify_outputs?.custom?.fileService?.apiGatewayUrl) {
        return amplify_outputs.custom.fileService.apiGatewayUrl;
      }
      if (amplify_outputs?.custom?.analyticsService?.apiGatewayUrl) {
        return amplify_outputs.custom.analyticsService.apiGatewayUrl;
      }
      if (amplify_outputs?.custom?.notificationService?.apiGatewayUrl) {
        return amplify_outputs.custom.notificationService.apiGatewayUrl;
      }
    } catch (error) {
      console.warn('Could not read amplify_outputs.json:', error);
    }
    
    // Fallback to placeholder URL
    return 'https://your-api-gateway-url.amazonaws.com/prod';
  }

  // File Processing
  async processFile(request: FileProcessingRequest): Promise<FileProcessingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/file-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Notifications
  async sendNotification(request: NotificationRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // If Lambda functions are not deployed yet, skip notifications
    if (!this.isDeployed) {
      console.warn('Lambda functions not deployed yet, skipping notifications');
      return {
        success: true,
        messageId: 'fallback-' + Date.now(),
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/notification-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Analytics
  async trackEvent(request: AnalyticsRequest): Promise<{ success: boolean; eventId?: string; error?: string }> {
    // If Lambda functions are not deployed yet, skip analytics tracking
    if (!this.isDeployed) {
      console.warn('Lambda functions not deployed yet, skipping analytics tracking');
      return {
        success: true,
        eventId: 'fallback-' + Date.now(),
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/analytics-service/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics tracking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Folder Management
  async createFolder(request: FolderCreateRequest): Promise<FolderCreateResponse> {
    // If Lambda functions are not deployed yet, fall back to S3 service
    if (!this.isDeployed) {
      console.warn('Lambda functions not deployed yet, falling back to S3 service');
      return this.fallbackToS3Service(request);
    }

    try {
      const response = await fetch(`${this.baseUrl}/folder-service/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Folder creation error:', error);
      // If Lambda fails, fall back to S3 service
      return this.fallbackToS3Service(request);
    }
  }

  private async fallbackToS3Service(request: FolderCreateRequest): Promise<FolderCreateResponse> {
    try {
      // Import S3 service dynamically to avoid circular dependencies
      const { s3Service } = await import('./s3Service');
      
      const result = await s3Service.createFolder(
        request.folderName,
        request.parentFolderId,
        request.allowedFileTypes
      );

      if (result.success && result.folderId) {
        return {
          success: true,
          folderId: result.folderId,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create folder',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      };
    }
  }

  async getFolders(userEmail: string): Promise<{ success: boolean; folders?: any[]; error?: string }> {
    // If Lambda functions are not deployed yet, fall back to S3 service
    if (!this.isDeployed) {
      console.warn('Lambda functions not deployed yet, falling back to S3 service');
      return this.fallbackGetFoldersFromS3();
    }

    try {
      const response = await fetch(`${this.baseUrl}/folder-service/list?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get folders error:', error);
      // If Lambda fails, fall back to S3 service
      return this.fallbackGetFoldersFromS3();
    }
  }

  private async fallbackGetFoldersFromS3(): Promise<{ success: boolean; folders?: any[]; error?: string }> {
    try {
      // Import S3 service dynamically to avoid circular dependencies
      const { s3Service } = await import('./s3Service');
      
      const result = await s3Service.listFolders();
      if (result.success && result.folders) {
        return {
          success: true,
          folders: result.folders,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get folders',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get folders',
      };
    }
  }

  async deleteFolder(userEmail: string, folderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/folder-service/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail, folderId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete folder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // File Management
  async uploadFile(request: FileUploadRequest): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/file-service/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getFiles(userEmail: string, folderId?: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const url = folderId 
        ? `${this.baseUrl}/file-service/list?userEmail=${encodeURIComponent(userEmail)}&folderId=${folderId}`
        : `${this.baseUrl}/file-service/list?userEmail=${encodeURIComponent(userEmail)}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get files error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAnalyticsReport(userId: string): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics-service/report?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics report error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Backup
  async performBackup(request: BackupRequest): Promise<{ success: boolean; backupId?: string; filesBackedUp?: number; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/backup-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Backup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper method to update base URL after deployment
  updateBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl;
  }
}

export const lambdaService = new LambdaService();
