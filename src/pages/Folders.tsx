import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Folder, 
  FolderPlus, 
  MoreHorizontal, 
  FolderOpen, 
  Share2, 
  Trash2,
  Upload,
  Lock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { s3Service } from "@/lib/s3Service";
import { dynamoService } from "@/lib/dynamoService";
import { lambdaService } from "@/lib/lambdaService";
import { authService } from "@/lib/authService";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  modified: string;
  folder: string;
  tags: string[];
  confidentiality: 'public' | 'internal' | 'confidential';
  importance: 'low' | 'medium' | 'high';
  allowSharing: boolean;
  allowedFileTypes?: string[];
  s3FolderId?: string;
}

export default function Folders() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderFileTypes, setNewFolderFileTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  const availableFileTypes = [
    'all', 'documents', 'images', 'videos', 'audio', 'archives', 'code', 'data'
  ];

  // Load all folders from DynamoDB
  useEffect(() => {
    const loadAllFoldersFromDynamo = async () => {
      try {
        // Get all folders from DynamoDB - much simpler and more reliable
        const result = await dynamoService.getAllFolders();
        
        if (!result.success || !result.folders) {
          console.error('Failed to load folders from DynamoDB:', result.error);
          return;
        }

        // Convert to FileItem format
        const folderItems: FileItem[] = result.folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          size: '0 files',
          modified: new Date(folder.createdAt).toLocaleDateString(),
          folder: folder.parentId ? 'Subfolder' : 'Root',
          tags: [],
          confidentiality: folder.confidentiality,
          importance: folder.importance,
          allowSharing: folder.allowSharing,
          allowedFileTypes: folder.allowedFileTypes,
          s3FolderId: folder.id
        }));
        
        console.log('Loaded folders from DynamoDB:', folderItems);
        console.log('Total folders found:', folderItems.length);
        setFiles(folderItems);
      } catch (error) {
        console.error('Error loading folders from DynamoDB:', error);
      }
    };

    loadAllFoldersFromDynamo();
  }, []);

  // Load folders from Lambda function
  const loadFoldersFromLambda = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      const result = await lambdaService.getFolders(currentUser.email);
      if (result.success && result.folders) {
        const lambdaFolders: FileItem[] = result.folders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          size: '0 files',
          modified: new Date(folder.createdAt).toLocaleDateString(),
          folder: 'Root',
          tags: [],
          confidentiality: folder.confidentiality,
          importance: folder.importance,
          allowSharing: folder.allowSharing,
          allowedFileTypes: folder.allowedFileTypes || ['all'],
          s3FolderId: folder.id
        }));

        setFiles(lambdaFolders);
      }
    } catch (error) {
      console.error('Failed to load folders from Lambda:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user for Lambda function
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        toast({
          title: "Error",
          description: "Please sign in to create folders",
          variant: "destructive",
        });
        return;
      }

      // Create folder using Lambda function
      const result = await lambdaService.createFolder({
        userEmail: currentUser.email,
        userId: currentUser.id,
        folderName: newFolderName.trim(),
        parentFolderId: undefined, // Root folder
        allowedFileTypes: newFolderFileTypes.length > 0 ? newFolderFileTypes : ['all'],
        confidentiality: 'internal',
        importance: 'low',
        allowSharing: true,
      });

      if (!result.success || !result.folderId) {
        toast({
          title: "Error",
          description: result.error || "Failed to create folder",
          variant: "destructive",
        });
        return;
      }

      // Track analytics
      await lambdaService.trackEvent({
        userId: currentUser.id,
        userEmail: currentUser.email,
        eventType: 'folder_create',
        eventData: {
          folderName: newFolderName.trim(),
          folderId: result.folderId,
        },
      });

      // Send notification
      await lambdaService.sendNotification({
        type: 'folder_created',
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        data: {
          folderName: newFolderName.trim(),
        },
      });

      // Refresh folders from Lambda
      await loadFoldersFromLambda();

      setNewFolderName("");
      setNewFolderFileTypes([]);
      setShowCreateFolderModal(false);

      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (name: string, id: string, isFolder: boolean = false) => {
    if (isFolder) {
      try {
        const result = await dynamoService.deleteFolder(id);
        if (!result.success) {
          toast({
            title: "Error",
            description: result.error || "Failed to delete folder",
            variant: "destructive",
          });
          return;
        }
        
        setFiles(prev => prev.filter(file => file.id !== id));
        toast({
          title: "Success",
          description: "Folder deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting folder:', error);
        toast({
          title: "Error",
          description: "Failed to delete folder",
          variant: "destructive",
        });
      }
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return Folder;
      default:
        return Folder;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'folder':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getConfidentialityColor = (level: string) => {
    switch (level) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'internal':
        return 'bg-blue-100 text-blue-800';
      case 'confidential':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImportanceColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Folders</h1>
          <p className="text-muted-foreground">Manage your file folders and organization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const loadAllFoldersFromDynamo = async () => {
                try {
                  // Get all folders from DynamoDB - much simpler and more reliable
                  const result = await dynamoService.getAllFolders();
                  
                  if (!result.success || !result.folders) {
                    console.error('Failed to load folders from DynamoDB:', result.error);
                    return;
                  }

                  // Convert to FileItem format
                  const folderItems: FileItem[] = result.folders.map((folder) => ({
                    id: folder.id,
                    name: folder.name,
                    type: 'folder',
                    size: '0 files',
                    modified: new Date(folder.createdAt).toLocaleDateString(),
                    folder: folder.parentId ? 'Subfolder' : 'Root',
                    tags: [],
                    confidentiality: folder.confidentiality,
                    importance: folder.importance,
                    allowSharing: folder.allowSharing,
                    allowedFileTypes: folder.allowedFileTypes,
                    s3FolderId: folder.id
                  }));
                  
                  console.log('Refreshed folders from DynamoDB:', folderItems);
                  console.log('Total folders found on refresh:', folderItems.length);
                  setFiles(folderItems);
                } catch (error) {
                  console.error('Error loading folders from DynamoDB:', error);
                }
              };
              loadAllFoldersFromDynamo();
            }}
          >
            Refresh
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Dialog open={showCreateFolderModal} onOpenChange={setShowCreateFolderModal}>
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
                <div>
                  <Label>Allowed File Types</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableFileTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={newFolderFileTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewFolderFileTypes(prev => [...prev, type]);
                            } else {
                              setNewFolderFileTypes(prev => prev.filter(t => t !== type));
                            }
                          }}
                        />
                        <Label htmlFor={type} className="text-sm capitalize">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateFolderModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder}>
                    Create Folder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Folders Grid/List */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">All Folders</CardTitle>
          <p className="text-sm text-muted-foreground">
            {files.length} folder{files.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No folders yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first folder to organize your files.
              </p>
              <Button onClick={() => setShowCreateFolderModal(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {files.map((folder) => {
                const IconComponent = getFileIcon(folder.type);
                return (
                  <div
                    key={folder.id}
                    className="group relative p-3 border rounded-lg hover:shadow-sm transition-all duration-200 cursor-pointer hover:border-primary/50"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`${getFileTypeColor(folder.type)}`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div className="w-full">
                        <p className="font-medium text-xs truncate" title={folder.name}>
                          {folder.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{folder.size}</p>
                        <p className="text-xs text-muted-foreground">{folder.modified}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={`text-xs px-1 py-0 ${getConfidentialityColor(folder.confidentiality)}`}>
                            {folder.confidentiality}
                          </Badge>
                          {folder.importance !== 'low' && (
                            <Badge className={`text-xs px-1 py-0 ${getImportanceColor(folder.importance)}`}>
                              {folder.importance}
                            </Badge>
                          )}
                          {!folder.allowSharing && (
                            <Lock className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        {folder.type === 'folder' && folder.allowedFileTypes && (
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground">
                              {folder.allowedFileTypes.includes('all') 
                                ? 'All file types' 
                                : `${folder.allowedFileTypes.length} file type${folder.allowedFileTypes.length > 1 ? 's' : ''}`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Open Folder
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(folder.name, folder.id, true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((folder) => {
                const IconComponent = getFileIcon(folder.type);
                return (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={getFileTypeColor(folder.type)}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">{folder.modified}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{folder.size}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Open Folder
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Folder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(folder.name, folder.id, true)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
