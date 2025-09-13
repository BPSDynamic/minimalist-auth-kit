import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UploadDialog } from "@/components/upload/UploadDialog";
import { FileManager } from "@/components/upload/FileManager";
import { FileMetadata, s3Service } from "@/lib/s3Service";
import { lambdaService } from "@/lib/lambdaService";
import { authService } from "@/lib/authService";
import { dynamoService } from "@/lib/dynamoService";
import { 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  Download, 
  Share2, 
  MoreHorizontal,
  FolderPlus,
  FolderOpen,
  Filter,
  SortDesc,
  File,
  Folder,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Trash2,
  X,
  Plus,
  Lock,
  Unlock,
  Star,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface FileItem {
  id: number;
  name: string;
  type: string;
  size: string;
  modified: string;
  icon: any;
  thumbnail?: string;
  folder?: string;
  tags?: string[];
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  importance: 'low' | 'medium' | 'high' | 'critical';
  allowSharing: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  allowedFileTypes?: string[]; // For folders only
  s3FolderId?: string; // S3 folder ID for deletion
}

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('Root');
  const [folderPath, setFolderPath] = useState<string[]>(['Root']);
  const [files, setFiles] = useState<FileItem[]>([]);

  // State for modals and functionality
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderFileTypes, setSelectedFolderFileTypes] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadFolder, setUploadFolder] = useState(currentFolder);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploadConfidentiality, setUploadConfidentiality] = useState<'public' | 'internal' | 'confidential' | 'restricted'>('internal');
  const [uploadImportance, setUploadImportance] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [allowSharing, setAllowSharing] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Update upload folder when current folder changes
  useEffect(() => {
    setUploadFolder(currentFolder);
  }, [currentFolder]);

  // Load folders from DynamoDB when component mounts
  useEffect(() => {
    const loadFoldersFromDynamoDB = async () => {
      try {
        const result = await dynamoService.getAllFolders();
        if (result.success && result.folders) {
          // Filter folders for current folder context
          const currentFolderId = currentFolder === 'Root' ? undefined : currentFolder;
          const relevantFolders = result.folders.filter((folder: any) => 
            currentFolderId ? folder.parentId === currentFolderId : !folder.parentId
          );
          
          const dynamoFolders: FileItem[] = relevantFolders.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
            type: "folder",
            size: "0 files",
            modified: new Date(folder.createdAt).toLocaleDateString(),
            icon: Folder,
            folder: currentFolder,
            tags: [],
            confidentiality: folder.confidentiality || "internal",
            importance: folder.importance || "medium",
            allowSharing: folder.allowSharing !== false,
            allowedFileTypes: folder.allowedFileTypes || ['all'],
            s3FolderId: folder.id
          }));
          
          setFiles(prev => {
            // Remove existing folders for current folder
            const filteredFiles = prev.filter(f => !(f.type === 'folder' && f.folder === currentFolder));
            // Add new folders, but check for duplicates by name and folder context
            const existingFolderNames = new Set(
              filteredFiles
                .filter(f => f.type === 'folder' && f.folder === currentFolder)
                .map(f => f.name)
            );
            
            const newUniqueFolders = dynamoFolders.filter(folder => 
              !existingFolderNames.has(folder.name)
            );
            
            return [...filteredFiles, ...newUniqueFolders];
          });
        }
      } catch (error) {
        console.error('Failed to load folders from DynamoDB:', error);
      }
    };

    loadFoldersFromDynamoDB();
  }, [currentFolder]);

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
      type: "folder",
          size: "0 files",
          modified: new Date(folder.createdAt).toLocaleDateString(),
      icon: Folder,
          folder: currentFolder,
          tags: [],
          confidentiality: folder.confidentiality as const,
          importance: folder.importance as const,
          allowSharing: folder.allowSharing,
          allowedFileTypes: folder.allowedFileTypes || ['all'],
          s3FolderId: folder.id
        }));

        setFiles(prev => {
          // Remove existing folders for current folder
          const filteredFiles = prev.filter(f => !(f.type === 'folder' && f.folder === currentFolder));
          // Add new folders, but check for duplicates by name and folder context
          const existingFolderNames = new Set(
            filteredFiles
              .filter(f => f.type === 'folder' && f.folder === currentFolder)
              .map(f => f.name)
          );
          
          const newUniqueFolders = lambdaFolders.filter(folder => 
            !existingFolderNames.has(folder.name)
          );
          
          return [...filteredFiles, ...newUniqueFolders];
        });
      }
    } catch (error) {
      console.error('Failed to load folders from Lambda:', error);
    }
  };

  // Clean up any existing duplicates on component mount
  useEffect(() => {
    setFiles(prev => {
      // Remove duplicate folders by name and folder context
      const seen = new Set();
      return prev.filter(file => {
        if (file.type === 'folder') {
          const key = `${file.name}-${file.folder}`;
          if (seen.has(key)) {
            return false; // Remove duplicate
          }
          seen.add(key);
        }
        return true;
      });
    });
  }, []); // Run only once on mount

  // Filter files and folders based on current folder
  const getCurrentFolderFiles = () => {
    return files.filter(file => file.folder === currentFolder && file.type !== 'folder');
  };

  const getCurrentFolderFolders = () => {
    return files.filter(file => file.type === 'folder' && file.folder === currentFolder);
  };

  // Get all folders (for root view)
  const getAllFolders = () => {
    return files.filter(file => file.type === 'folder');
  };

  // Available folders and tags - remove duplicates
  const allFolderNames = getAllFolders().map(f => f.name);
  const uniqueFolderNames = [...new Set(allFolderNames)]; // Remove duplicates
  const availableFolders = ['Root', ...uniqueFolderNames];
  const availableTags = ['business', 'personal', 'design', 'documents', 'media', 'presentation', 'archive', 'backup', 'photos', 'video', 'audio', 'text', 'proposal', 'assets', 'notes', 'music'];
  const availableFileTypes = [
    { value: 'all', label: 'All Files', icon: File },
    { value: 'image', label: 'Images', icon: Image },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'audio', label: 'Audio', icon: Music },
    { value: 'pdf', label: 'PDFs', icon: FileText },
    { value: 'text', label: 'Text Files', icon: FileText },
    { value: 'archive', label: 'Archives', icon: Archive },
    { value: 'document', label: 'Documents', icon: FileText },
    { value: 'spreadsheet', label: 'Spreadsheets', icon: FileText }
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return Folder;
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'pdf': return FileText;
      case 'text': return FileText;
      case 'archive': return Archive;
      default: return File;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'folder': return 'text-blue-600';
      case 'image': return 'text-green-600';
      case 'video': return 'text-purple-600';
      case 'audio': return 'text-orange-600';
      case 'pdf': return 'text-red-600';
      case 'text': return 'text-gray-600';
      case 'archive': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const handleDelete = async (fileName: string, fileId?: number, isFolder: boolean = false) => {
    try {
      if (isFolder) {
        // Find the folder in the files array to get its details
        const folder = files.find(f => f.name === fileName && f.type === 'folder');
        if (folder && folder.s3FolderId) {
          // Delete folder from DynamoDB
          const result = await dynamoService.deleteFolder(folder.s3FolderId);

          if (result.success) {
            // Remove from local state
            setFiles(prev => prev.filter(f => f.id !== folder.id));
            toast({
              title: "Folder deleted",
              description: `${fileName} folder has been deleted from DynamoDB`,
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to delete folder",
              variant: "destructive",
            });
          }
        }
      } else {
        // For files, just show the trash message for now
        toast({
          title: "Moved to trash",
          description: `${fileName} has been moved to trash`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getConfidentialityColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'confidential': return 'bg-yellow-100 text-yellow-800';
      case 'restricted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImportanceColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidentialityIcon = (level: string) => {
    switch (level) {
      case 'public': return Eye;
      case 'internal': return Shield;
      case 'confidential': return Lock;
      case 'restricted': return AlertTriangle;
      default: return Eye;
    }
  };

  const getImportanceIcon = (level: string) => {
    switch (level) {
      case 'low': return null;
      case 'medium': return Star;
      case 'high': return Star;
      case 'critical': return AlertTriangle;
      default: return null;
    }
  };

  // File operations
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
        folderName: newFolderName,
        parentFolderId: currentFolder === 'Root' ? undefined : currentFolder,
        allowedFileTypes: selectedFolderFileTypes.length > 0 ? selectedFolderFileTypes : ['all'],
        confidentiality: 'internal',
        importance: 'medium',
        allowSharing: true,
      });

      if (result.success && result.folderId) {
        setNewFolderName('');
        setSelectedFolderFileTypes([]);
        setShowCreateFolder(false);
        
        // Track analytics
        await lambdaService.trackEvent({
          userId: currentUser.id,
          userEmail: currentUser.email,
          eventType: 'folder_create',
          eventData: {
            folderName: newFolderName,
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
            folderName: newFolderName,
          },
        });
        
        // Refresh folders from DynamoDB
        const refreshResult = await dynamoService.getAllFolders();
        if (refreshResult.success && refreshResult.folders) {
          const currentFolderId = currentFolder === 'Root' ? undefined : currentFolder;
          const relevantFolders = refreshResult.folders.filter((folder: any) => 
            currentFolderId ? folder.parentId === currentFolderId : !folder.parentId
          );
          
          const dynamoFolders: FileItem[] = relevantFolders.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
            type: "folder",
            size: "0 files",
            modified: new Date(folder.createdAt).toLocaleDateString(),
            icon: Folder,
            folder: currentFolder,
            tags: [],
            confidentiality: folder.confidentiality || "internal",
            importance: folder.importance || "medium",
            allowSharing: folder.allowSharing !== false,
            allowedFileTypes: folder.allowedFileTypes || ['all'],
            s3FolderId: folder.id
          }));
          
          setFiles(prev => {
            const filteredFiles = prev.filter(f => !(f.type === 'folder' && f.folder === currentFolder));
            return [...filteredFiles, ...dynamoFolders];
          });
        }
        
        const fileTypesText = selectedFolderFileTypes.length > 0 
          ? ` for ${selectedFolderFileTypes.join(', ')} files`
          : ' for all file types';
        
        toast({
          title: "Folder created",
          description: `"${newFolderName}" folder has been created${fileTypesText}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create folder",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Upload files to S3
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const newFile: FileItem = {
          id: Date.now() + i,
          name: file.name,
          type: file.type.split('/')[0] || 'file',
          size: formatFileSize(file.size),
          modified: "Just now",
          icon: getFileIcon(file.type.split('/')[0] || 'file'),
          folder: uploadFolder,
          tags: uploadTags,
          confidentiality: uploadConfidentiality,
          importance: uploadImportance,
          allowSharing: allowSharing,
          isUploading: true,
          uploadProgress: 0
        };

        setFiles(prev => [newFile, ...prev]);

        // Upload to S3 with progress tracking
        const uploadOptions = {
          folderId: uploadFolder === 'Root' ? undefined : uploadFolder,
          tags: uploadTags,
          confidentiality: uploadConfidentiality,
          importance: uploadImportance,
          allowSharing: allowSharing,
          onProgress: (progress: any) => {
            setFiles(prev => prev.map(f => 
              f.id === newFile.id ? { ...f, uploadProgress: progress.percentage } : f
            ));
          },
        };

        const result = await s3Service.uploadFile(file, uploadOptions);
        
        if (result.success) {
          // Mark upload as complete
          setFiles(prev => prev.map(f => 
            f.id === newFile.id ? { ...f, isUploading: false, uploadProgress: undefined } : f
          ));
        } else {
          // Mark upload as failed
          setFiles(prev => prev.map(f => 
            f.id === newFile.id ? { 
              ...f, 
              isUploading: false, 
              uploadProgress: undefined,
              // You could add an error state here
            } : f
          ));
        }
      }

      setIsUploading(false);
      setSelectedFiles([]);
      setShowUploadModal(false);
      
      toast({
        title: "Upload complete",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTagToggle = (tag: string) => {
    setUploadTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleFolderFileTypeToggle = (fileType: string) => {
    setSelectedFolderFileTypes(prev => 
      prev.includes(fileType) 
        ? prev.filter(t => t !== fileType)
        : [...prev, fileType]
    );
  };

  // Folder navigation functions
  const handleFolderClick = (folderName: string) => {
    // Don't navigate if we're already in this folder
    if (currentFolder === folderName) {
      return;
    }
    
    setCurrentFolder(folderName);
    setFolderPath(prev => [...prev, folderName]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolder(newPath[newPath.length - 1]);
  };

  const handleBackToParent = () => {
    if (folderPath.length > 1) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1]);
    } else {
      // Go back to Root
      setFolderPath(['Root']);
      setCurrentFolder('Root');
    }
  };

  const handleS3UploadComplete = (uploadedFiles: FileMetadata[]) => {
    toast({
      title: "Files uploaded successfully!",
      description: `${uploadedFiles.length} file(s) uploaded to S3`,
    });
    // Refresh the file list or update the UI as needed
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
    setShowUploadModal(true);
  }, []);

  return (
    <div className="flex flex-col space-y-6">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">My Files</h1>
            {folderPath.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToParent}
                className="h-6 px-2 text-xs"
              >
                ← Back
              </Button>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
              <Folder className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {currentFolder}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {folderPath.map((folder, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-muted-foreground">/</span>
                )}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`px-2 py-1 rounded-md transition-all duration-200 ${
                    index === folderPath.length - 1 
                      ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {folder}
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">2.4 GB used of 15 GB storage</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold">Create New Folder</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Organize your files with a dedicated folder
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Folder Name Section */}
                <div className="space-y-2">
                  <Label htmlFor="folder-name" className="text-sm font-medium">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Project Assets, Documents, Photos..."
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    className="h-10"
                  />
                </div>

                {/* File Types Section */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">File Types</Label>
                    <p className="text-xs text-muted-foreground">
                      Optional: Restrict this folder to specific file types
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {availableFileTypes.map((fileType) => {
                      const IconComponent = fileType.icon;
                      const isSelected = selectedFolderFileTypes.includes(fileType.value);
                      return (
                        <Button
                          key={fileType.value}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFolderFileTypeToggle(fileType.value)}
                          className={`h-16 p-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'hover:bg-muted/50 border-border/50'
                          }`}
                        >
                          <IconComponent className={`h-4 w-4 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                            {fileType.label}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  
                  {selectedFolderFileTypes.length > 0 && (
                    <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                        <p className="text-xs font-medium text-primary">
                          {selectedFolderFileTypes.length} file type{selectedFolderFileTypes.length > 1 ? 's' : ''} selected
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedFolderFileTypes.join(' • ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                    setSelectedFolderFileTypes([]);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateFolder}
                  className="flex-1"
                  disabled={!newFolderName.trim()}
                >
                  Create Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            className="gap-2 h-9"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Folder Navigation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Folders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => {
                  setCurrentFolder('Root');
                  setFolderPath(['Root']);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                  currentFolder === 'Root' 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Root
                </div>
              </button>
              {getCurrentFolderFolders().map((folder) => (
                <div
                  key={folder.id}
                  className={`group relative w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    currentFolder === folder.name 
                      ? 'bg-primary text-primary-foreground font-medium' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <button
                    onClick={() => handleFolderClick(folder.name)}
                    onDoubleClick={() => handleFolderClick(folder.name)}
                    className="flex items-center gap-2 w-full"
                  >
                    <Folder className="h-4 w-4" />
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    {folder.allowedFileTypes && !folder.allowedFileTypes.includes('all') && (
                      <Badge variant="outline" className="text-xs">
                        {folder.allowedFileTypes.length}
                      </Badge>
                    )}
                  </button>
                  
                  {/* Folder Management Menu */}
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
                      <DropdownMenuItem onClick={() => handleFolderClick(folder.name)}>
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
              ))}
              
              {/* Empty state for folders */}
              {getCurrentFolderFolders().length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No folders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Clean Storage & Upload Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Storage Usage */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Storage</span>
              <Badge variant="outline" className="text-xs">84% Free</Badge>
            </div>
            <Progress value={16} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
            <span>2.4 GB used</span>
            <span>15 GB total</span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone */}
        <Card className="lg:col-span-2 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-full">
              <UploadDialog
                folderId={currentFolder === 'Root' ? undefined : currentFolder}
                onUploadComplete={handleS3UploadComplete}
                trigger={
                  <div className="text-center space-y-3 cursor-pointer">
                    <div className="p-3 rounded-full bg-primary/10 mx-auto w-fit">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Upload files to S3</p>
                      <p className="text-xs text-muted-foreground">Click to open upload dialog</p>
                    </div>
                  </div>
                }
              />
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Clean Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-border/50 focus:border-primary/50"
            />
          </div>
          <Button variant="outline" size="sm" className="h-10 px-3">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-10 px-3">
            <SortDesc className="h-4 w-4 mr-2" />
            Sort
          </Button>
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>


          {/* S3 Files Manager */}
          <FileManager
            folderId={currentFolder === 'Root' ? undefined : currentFolder}
            onFileDeleted={(fileId) => {
              toast({
                title: "File deleted",
                description: "File has been removed from S3",
              });
            }}
          />

          {/* Root View - Show welcome message when no files */}
          {currentFolder === 'Root' && getCurrentFolderFiles().length === 0 && (
            <Card className="border-border/50">
              <CardContent className="text-center py-12">
                <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Welcome to CloudVault</h3>
                <p className="text-muted-foreground mb-4">
                  Your files are organized in folders. Create a folder or upload files to get started.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowCreateFolder(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Folder
                  </Button>
                  <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty folder state */}
          {currentFolder !== 'Root' && getCurrentFolderFiles().length === 0 && (
            <Card className="border-border/50">
              <CardContent className="text-center py-12">
                <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Empty Folder</h3>
                <p className="text-muted-foreground mb-4">
                  This folder is empty. Upload files to get started.
                </p>
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Files Section - Show when inside a folder or when there are files in root */}
          {getCurrentFolderFiles().length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                  {currentFolder === 'Root' ? 'Files' : `Files in ${currentFolder}`}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getCurrentFolderFiles().length} file{getCurrentFolderFiles().length !== 1 ? 's' : ''}
                </p>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {getCurrentFolderFiles().map((file) => {
                const IconComponent = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                          className="group relative p-3 border rounded-lg hover:shadow-sm transition-all duration-200 cursor-pointer hover:border-primary/50"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`${getFileTypeColor(file.type)}`}>
                              <IconComponent className="h-8 w-8" />
                      </div>
                      <div className="w-full">
                              <p className="font-medium text-xs truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                        <p className="text-xs text-muted-foreground">{file.modified}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge className={`text-xs px-1 py-0 ${getConfidentialityColor(file.confidentiality)}`}>
                                  {file.confidentiality}
                                </Badge>
                                {file.importance !== 'low' && (
                                  <Badge className={`text-xs px-1 py-0 ${getImportanceColor(file.importance)}`}>
                                    {file.importance}
                                  </Badge>
                                )}
                                {!file.allowSharing && (
                                  <Lock className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                              {file.isUploading && (
                                <div className="mt-1">
                                  <Progress value={file.uploadProgress} className="h-1" />
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
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(file.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Move to Trash
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
                  <div className="space-y-1">
                    {getCurrentFolderFiles().map((file) => {
                const IconComponent = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                          className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={getFileTypeColor(file.type)}>
                              <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.modified}</p>
                      </div>
                    </div>
                    
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDelete(file.name)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Move to Trash
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
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Configure settings for your file upload.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Selected Files */}
            <div>
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Folder Selection */}
            <div>
              <Label htmlFor="upload-folder">Save to Folder</Label>
              <Select value={uploadFolder} onValueChange={setUploadFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  {availableFolders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={uploadTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                    className="h-8"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Confidentiality */}
            <div>
              <Label htmlFor="confidentiality">Confidentiality Level</Label>
              <Select value={uploadConfidentiality} onValueChange={(value: any) => setUploadConfidentiality(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="internal">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Internal
                    </div>
                  </SelectItem>
                  <SelectItem value="confidential">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Confidential
                    </div>
                  </SelectItem>
                  <SelectItem value="restricted">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Restricted
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Importance */}
            <div>
              <Label htmlFor="importance">Importance Level</Label>
              <Select value={uploadImportance} onValueChange={(value: any) => setUploadImportance(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sharing Permission */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-sharing"
                checked={allowSharing}
                onCheckedChange={(checked) => setAllowSharing(checked as boolean)}
              />
              <Label htmlFor="allow-sharing" className="flex items-center gap-2">
                {allowSharing ? <Share2 className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Allow sharing
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
              {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}