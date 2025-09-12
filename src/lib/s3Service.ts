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
  // Sharing metadata
  shareRecipients?: string[];
  shareMessage?: string;
  shareExpirationDays?: number;
  shareLink?: string;
  shareSender?: {
    name: string;
    surname: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UploadOptions {
  folderId?: string;
  tags?: string[];
  confidentiality?: 'public' | 'internal' | 'confidential' | 'restricted';
  importance?: 'low' | 'medium' | 'high' | 'critical';
  allowSharing?: boolean;
  // Sharing options
  shareRecipients?: string[];
  shareMessage?: string;
  shareExpirationDays?: number;
  shareLink?: string;
  shareSender?: {
    name: string;
    surname: string;
    email: string;
  };
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
      // folderId is now the actual folder name
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
          accessLevel: 'guest',
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
        // Include sharing metadata
        shareRecipients: options.shareRecipients,
        shareMessage: options.shareMessage,
        shareExpirationDays: options.shareExpirationDays,
        shareLink: options.shareLink,
        shareSender: options.shareSender,
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
          accessLevel: 'guest',
        },
      }).result;

      return {
        success: true,
        blob: downloadResult.body as unknown as Blob,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to download file',
      };
    }
  }

  // Get file download URL
  async getFileUrl(s3Key: string, expiresIn: number = 86400): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const url = await getUrl({
        key: s3Key,
        options: {
          accessLevel: 'guest',
          expiresIn, // URL expires in 24 hours by default
        },
      });

      return {
        success: true,
        url: url.url.toString(),
      };
    } catch (error: any) {
      console.error('Error getting file URL:', error);
      return {
        success: false,
        error: error.message || 'Failed to get file URL',
      };
    }
  }

  // Refresh file URL if expired
  async refreshFileUrl(s3Key: string): Promise<{ success: boolean; url?: string; error?: string }> {
    console.log('Refreshing expired URL for:', s3Key);
    return this.getFileUrl(s3Key, 86400); // 24 hours
  }

  // Update file metadata
  async updateFileMetadata(s3Key: string, metadata: FileMetadata): Promise<{ success: boolean; error?: string }> {
    try {
      // Create metadata key for the file
      const metadataKey = `.metadata/files/${metadata.id}.json`;
      
      // Upload updated metadata
      await uploadData({
        key: metadataKey,
        data: JSON.stringify(metadata, null, 2),
        options: {
          accessLevel: 'guest',
        },
      }).result;

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update file metadata',
      };
    }
  }

  // Delete file from S3
  async deleteFile(s3Key: string): Promise<{ success: boolean; error?: string }> {
    try {
      await remove({
        key: s3Key,
        options: {
          accessLevel: 'guest',
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
          accessLevel: 'guest',
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

  // Create folder in S3
  async createFolder(
    folderName: string, 
    parentFolderId?: string,
    allowedFileTypes?: string[]
  ): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      const identityId = await this.getIdentityId();
      
      // Use the original folder name as the folder key in S3
      // Only sanitize for S3 compatibility (remove special characters that S3 doesn't allow)
      const sanitizedName = folderName.replace(/[^a-zA-Z0-9.\-_\s]/g, '_').trim();
      
      // Generate unique folder ID for internal tracking (but keep original name for display)
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create folder metadata
      const folderMetadata = {
        id: uniqueId,
        name: folderName, // Keep the original folder name
        displayName: folderName, // Explicit display name
        type: 'folder',
        parentFolderId: parentFolderId || 'root',
        allowedFileTypes: allowedFileTypes || ['all'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: (user as any).username || (user as any).userId || 'unknown',
      };

      // Use the sanitized folder name as the S3 key (what shows up in S3 console)
      const folderKey = parentFolderId 
        ? `${parentFolderId}/${sanitizedName}/.folder_placeholder`
        : `${sanitizedName}/.folder_placeholder`;

      // Create a small placeholder file to establish the folder structure
      const placeholderBlob = new Blob(['FOLDER_PLACEHOLDER'], {
        type: 'text/plain'
      });

      console.log('Creating folder with name:', folderName);
      console.log('Using S3 key:', folderKey);

      // Upload the placeholder file to create the folder structure
      const uploadResult = await uploadData({
        key: folderKey,
        data: placeholderBlob,
        options: {
          accessLevel: 'guest',
        },
      }).result;

      console.log('Placeholder upload result:', uploadResult);

      // Store all metadata in a dedicated .metadata folder for clean S3 organization
      const metadataKey = `.metadata/folders/${sanitizedName}.json`;

      const metadataBlob = new Blob([JSON.stringify(folderMetadata, null, 2)], {
        type: 'application/json'
      });

      console.log('Creating metadata with key:', metadataKey);

      const metadataResult = await uploadData({
        key: metadataKey,
        data: metadataBlob,
        options: {
          accessLevel: 'guest',
        },
      }).result;

      console.log('Metadata upload result:', metadataResult);

      return {
        success: true,
        folderId: sanitizedName, // Return the folder name as the ID for consistency
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create folder',
      };
    }
  }

  // List folders
  async listFolders(parentFolderId?: string): Promise<{ success: boolean; folders?: any[]; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      const identityId = await this.getIdentityId();
      
      const prefix = parentFolderId 
        ? `${parentFolderId}/`
        : '';

      console.log('Listing folders with prefix:', prefix);

      const listResult = await list({
        prefix,
        options: {
          accessLevel: 'guest',
          listAll: true,
        },
      });

      console.log('List result items:', listResult.items);

      // Filter for folder placeholder files to identify folders
      const folderPromises = listResult.items
        .filter(item => (item as any).key.endsWith('.folder_placeholder'))
        .map(async (item) => {
          // Extract folder name from the key
          const key = (item as any).key;
          const keyParts = key.split('/');
          
          // Find the folder name (the part immediately before .folder_placeholder)
          const placeholderIndex = keyParts.findIndex(part => part === '.folder_placeholder');
          
          if (placeholderIndex <= 0) {
            console.warn('Invalid folder structure for key:', key);
            return null;
          }
          
          const folderName = keyParts[placeholderIndex - 1];
          
          // Additional validation
          if (!folderName || folderName.trim() === '') {
            console.warn('Empty folder name extracted from key:', key);
            return null;
          }
          
          console.log('Found folder:', folderName, 'from key:', key);
          
          // Try to get metadata for this folder from centralized location
          try {
            const metadataResult = await this.getFolderMetadata(folderName);
            if (metadataResult.success) {
              return {
                id: folderName,
                name: metadataResult.metadata.name || folderName,
                displayName: metadataResult.metadata.displayName || metadataResult.metadata.name || folderName,
                ...metadataResult.metadata
              };
            } else {
              // Return basic folder info if metadata isn't available
              return {
                id: folderName,
                name: folderName,
                displayName: folderName,
                type: 'folder'
              };
            }
          } catch (error) {
            console.warn('Failed to get metadata for folder:', folderName, error);
            return {
              id: folderName,
              name: folderName,
              displayName: folderName,
              type: 'folder'
            };
          }
        });

      const folders = (await Promise.all(folderPromises)).filter(folder => folder !== null);

      console.log('Extracted folders with metadata:', folders);
      console.log('Number of folders found:', folders.length);

      return {
        success: true,
        folders,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list folders',
      };
    }
  }

  // Delete folder
  async deleteFolder(folderId: string, parentFolderId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      
      // First, list all files in the folder
      const filesResult = await this.listFiles(folderId);
      if (!filesResult.success) {
        return { success: false, error: filesResult.error };
      }

      // Delete all files in the folder
      if (filesResult.files && filesResult.files.length > 0) {
        const deletePromises = filesResult.files.map(file => 
          this.deleteFile(file.key)
        );
        await Promise.all(deletePromises);
      }

      // Delete the folder metadata file from centralized location
      const sanitizedFolderId = folderId.replace(/[^a-zA-Z0-9.\-_\s]/g, '_').trim();
      const metadataKey = `.metadata/folders/${sanitizedFolderId}.json`;

      await remove({
        key: metadataKey,
        options: {
          accessLevel: 'guest',
        },
      });

      // Delete the folder placeholder file
      const placeholderKey = parentFolderId 
        ? `${parentFolderId}/${folderId}/.folder_placeholder`
        : `${folderId}/.folder_placeholder`;

      await remove({
        key: placeholderKey,
        options: {
          accessLevel: 'guest',
        },
      });

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete folder',
      };
    }
  }

  // Get folder metadata from centralized location
  async getFolderMetadata(folderId: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
    try {
      // Validate input
      if (!folderId || folderId.trim() === '' || folderId === 'undefined') {
        return {
          success: false,
          error: 'Invalid folder ID provided',
        };
      }

      // Sanitize folder ID to match the stored metadata key
      const sanitizedFolderId = folderId.replace(/[^a-zA-Z0-9.\-_\s]/g, '_').trim();
      const metadataKey = `.metadata/folders/${sanitizedFolderId}.json`;

      console.log('Fetching metadata for key:', metadataKey);

      const result = await downloadData({
        key: metadataKey,
        options: {
          accessLevel: 'guest',
        },
      }).result;

      const metadataText = await (result.body as any).text();
      const metadata = JSON.parse(metadataText);

      return {
        success: true,
        metadata,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get folder metadata',
      };
    }
  }

  // List all metadata files for debugging/management
  async listAllMetadata(): Promise<{ success: boolean; metadataFiles?: string[]; error?: string }> {
    try {
      const listResult = await list({
        prefix: '.metadata/',
        options: {
          accessLevel: 'guest',
          listAll: true,
        },
      });

      const metadataFiles = listResult.items
        .map(item => (item as any).key)
        .filter(key => key.endsWith('.json'));

      return {
        success: true,
        metadataFiles,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list metadata files',
      };
    }
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
