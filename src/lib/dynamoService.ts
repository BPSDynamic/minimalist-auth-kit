import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import amplify_outputs from '../../amplify_outputs.json';

// Configure Amplify
Amplify.configure(amplify_outputs);

const client = generateClient<Schema>();

export interface FolderData {
  id: string;
  name: string;
  parentId?: string;
  userId: string;
  allowedFileTypes: string[];
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  importance: 'low' | 'medium' | 'high' | 'critical';
  allowSharing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string;
  allowedFileTypes?: string[];
  confidentiality?: 'public' | 'internal' | 'confidential' | 'restricted';
  importance?: 'low' | 'medium' | 'high' | 'critical';
  allowSharing?: boolean;
}

export class DynamoService {
  // Get current user ID
  private async getCurrentUserId(): Promise<string> {
    const { getCurrentUser } = await import('aws-amplify/auth');
    const user = await getCurrentUser();
    return user.userId;
  }

  // Create a new folder
  async createFolder(input: CreateFolderInput): Promise<{ success: boolean; folder?: FolderData; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date().toISOString();

      const folderData = {
        name: input.name,
        parentId: input.parentId || null,
        userId,
        allowedFileTypes: input.allowedFileTypes || ['all'],
        confidentiality: input.confidentiality || 'internal',
        importance: input.importance || 'low',
        allowSharing: input.allowSharing !== false,
        createdAt: now,
        updatedAt: now,
      };

      const result = await client.models.Folder.create(folderData);
      
      if (result.data) {
        return {
          success: true,
          folder: result.data as FolderData
        };
      } else {
        return {
          success: false,
          error: 'Failed to create folder'
        };
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get all folders for current user
  async listFolders(parentId?: string): Promise<{ success: boolean; folders?: FolderData[]; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      
      const result = await client.models.Folder.list({
        filter: {
          userId: { eq: userId },
          ...(parentId ? { parentId: { eq: parentId } } : { parentId: { attributeExists: false } })
        }
      });

      return {
        success: true,
        folders: result.data as FolderData[]
      };
    } catch (error) {
      console.error('Error listing folders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get all folders (including nested) for current user
  async getAllFolders(): Promise<{ success: boolean; folders?: FolderData[]; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      
      const result = await client.models.Folder.list({
        filter: {
          userId: { eq: userId }
        }
      });

      return {
        success: true,
        folders: result.data as FolderData[]
      };
    } catch (error) {
      console.error('Error listing all folders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get folder by ID
  async getFolder(folderId: string): Promise<{ success: boolean; folder?: FolderData; error?: string }> {
    try {
      const result = await client.models.Folder.get({ id: folderId });
      
      if (result.data) {
        return {
          success: true,
          folder: result.data as FolderData
        };
      } else {
        return {
          success: false,
          error: 'Folder not found'
        };
      }
    } catch (error) {
      console.error('Error getting folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update folder
  async updateFolder(folderId: string, updates: Partial<CreateFolderInput>): Promise<{ success: boolean; folder?: FolderData; error?: string }> {
    try {
      const now = new Date().toISOString();
      
      const result = await client.models.Folder.update({
        id: folderId,
        ...updates,
        updatedAt: now
      });

      if (result.data) {
        return {
          success: true,
          folder: result.data as FolderData
        };
      } else {
        return {
          success: false,
          error: 'Failed to update folder'
        };
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete folder
  async deleteFolder(folderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await client.models.Folder.delete({ id: folderId });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get folder hierarchy (for breadcrumbs)
  async getFolderPath(folderId: string): Promise<{ success: boolean; path?: FolderData[]; error?: string }> {
    try {
      const path: FolderData[] = [];
      let currentId: string | undefined = folderId;

      while (currentId) {
        const result = await this.getFolder(currentId);
        if (result.success && result.folder) {
          path.unshift(result.folder);
          currentId = result.folder.parentId || undefined;
        } else {
          break;
        }
      }

      return {
        success: true,
        path
      };
    } catch (error) {
      console.error('Error getting folder path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const dynamoService = new DynamoService();
