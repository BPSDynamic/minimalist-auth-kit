import { uploadData, downloadData, remove, list, getUrl } from 'aws-amplify/storage';
import { authService } from './authService';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  s3Key: string;
  folderId?: string;
  tags?: string[];
  confidentiality?: 'public' | 'internal' | 'confidential' | 'restricted';
  importance?: 'low' | 'medium' | 'high' | 'critical';
  allowSharing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadOptions {
  folderId?: string;
  tags?: string[];
  confidentiality?: 'public' | 'internal' | 'confidential' | 'restricted';
  importance?: 'low' | 'medium' | 'high' | 'critical';
  allowSharing?: boolean;
  onProgress?: (progress: UploadProgress) => void;
}

class S3Service {
  private getCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  };

  private getIdentityId = async (): Promise<string> => {
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      return session.identityId || '';
    } catch (error) {
      throw new Error('Failed to get identity ID');
    }
  };

  private generateS3Key = (identityId: string, fileName: string, folderId?: string): string => {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (folderId) {
      return `${folderId}/${timestamp}_${sanitizedFileName}`;
    }
    return `${timestamp}_${sanitizedFileName}`;
  };

  // Upload file to S3
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<{ success: boolean; fileMetadata?: FileMetadata; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      const identityId = await this.getIdentityId();
      const s3Key = this.generateS3Key(identityId, file.name, options.folderId);

      const uploadResult = await uploadData({
        key: s3Key,
        data: file,
        options: {
          accessLevel: 'public',
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (options.onProgress) {
              options.onProgress({
                loaded: transferredBytes,
                total: totalBytes,
                percentage: Math.round((transferredBytes / totalBytes) * 100),
              });
            }
          },
        },
      }).result;

      // Create file metadata
      const fileMetadata: FileMetadata = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        s3Key: uploadResult.key,
        folderId: options.folderId,
        tags: options.tags || [],
        confidentiality: options.confidentiality || 'internal',
        importance: options.importance || 'medium',
        allowSharing: options.allowSharing ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        fileMetadata,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      };
    }
  }

  // Download file from S3
  async downloadFile(s3Key: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const downloadResult = await downloadData({
        key: s3Key,
        options: {
          accessLevel: 'public',
        },
      }).result;

      return {
        success: true,
        blob: downloadResult.body as Blob,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to download file',
      };
    }
  }

  // Get file download URL
  async getFileUrl(s3Key: string, expiresIn: number = 3600): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const url = await getUrl({
        key: s3Key,
        options: {
          accessLevel: 'public',
          expiresIn, // URL expires in 1 hour by default
        },
      });

      return {
        success: true,
        url: url.url.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get file URL',
      };
    }
  }

  // Delete file from S3
  async deleteFile(s3Key: string): Promise<{ success: boolean; error?: string }> {
    try {
      await remove({
        key: s3Key,
        options: {
          accessLevel: 'public',
        },
      });

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete file',
      };
    }
  }

  // List files in a folder
  async listFiles(folderId?: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      const identityId = await this.getIdentityId();
      const prefix = folderId 
        ? `${folderId}/`
        : '';

      const listResult = await list({
        prefix,
        options: {
          accessLevel: 'public',
          listAll: true,
        },
      });

      return {
        success: true,
        files: listResult.items,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list files',
      };
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<{ success: boolean; results?: Array<{ success: boolean; fileMetadata?: FileMetadata; error?: string }>; error?: string }> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.all(uploadPromises);

      const allSuccessful = results.every(result => result.success);
      
      return {
        success: allSuccessful,
        results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload files',
      };
    }
  }

  // Get file size in human readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate file type
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type) || allowedTypes.includes('*');
  }

  // Validate file size
  validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  // Get file icon based on type
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📁';
  }
}

// Export singleton instance
export const s3Service = new S3Service();
