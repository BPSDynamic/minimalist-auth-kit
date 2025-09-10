import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  Download, 
  Share2, 
  MoreHorizontal,
  FolderPlus,
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
}

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: 1,
      name: "Project Proposal.pdf",
      type: "pdf",
      size: "2.4 MB",
      modified: "2 hours ago",
      icon: FileText,
      thumbnail: null,
      folder: "Documents",
      tags: ["business", "proposal"],
      confidentiality: "confidential",
      importance: "high",
      allowSharing: true
    },
    {
      id: 2,
      name: "Design Assets",
      type: "folder",
      size: "12 files",
      modified: "1 day ago",
      icon: Folder,
      thumbnail: null,
      folder: "Projects",
      tags: ["design", "assets"],
      confidentiality: "internal",
      importance: "medium",
      allowSharing: true
    },
    {
      id: 3,
      name: "vacation-2024.jpg",
      type: "image",
      size: "4.2 MB",
      modified: "3 days ago",
      icon: Image,
      thumbnail: "/placeholder.svg",
      folder: "Personal",
      tags: ["personal", "photos"],
      confidentiality: "public",
      importance: "low",
      allowSharing: false
    },
    {
      id: 4,
      name: "presentation.mp4",
      type: "video",
      size: "45.8 MB",
      modified: "1 week ago",
      icon: Video,
      thumbnail: null,
      folder: "Presentations",
      tags: ["presentation", "video"],
      confidentiality: "internal",
      importance: "high",
      allowSharing: true
    },
    {
      id: 5,
      name: "Documents",
      type: "folder",
      size: "24 files",
      modified: "2 weeks ago",
      icon: Folder,
      thumbnail: null,
      folder: "Root",
      tags: ["documents"],
      confidentiality: "internal",
      importance: "medium",
      allowSharing: true
    },
    {
      id: 6,
      name: "audio-track.mp3",
      type: "audio",
      size: "8.1 MB",
      modified: "3 weeks ago",
      icon: Music,
      thumbnail: null,
      folder: "Media",
      tags: ["audio", "music"],
      confidentiality: "public",
      importance: "low",
      allowSharing: true
    },
    {
      id: 7,
      name: "backup.zip",
      type: "archive",
      size: "124 MB",
      modified: "1 month ago",
      icon: Archive,
      thumbnail: null,
      folder: "Backups",
      tags: ["backup", "archive"],
      confidentiality: "restricted",
      importance: "critical",
      allowSharing: false
    },
    {
      id: 8,
      name: "notes.txt",
      type: "text",
      size: "1.2 KB",
      modified: "2 months ago",
      icon: FileText,
      thumbnail: null,
      folder: "Personal",
      tags: ["notes", "text"],
      confidentiality: "public",
      importance: "low",
      allowSharing: false
    }
  ]);

  // State for modals and functionality
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadFolder, setUploadFolder] = useState('Root');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploadConfidentiality, setUploadConfidentiality] = useState<'public' | 'internal' | 'confidential' | 'restricted'>('internal');
  const [uploadImportance, setUploadImportance] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [allowSharing, setAllowSharing] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Available folders and tags
  const availableFolders = ['Root', 'Documents', 'Projects', 'Personal', 'Media', 'Presentations', 'Backups'];
  const availableTags = ['business', 'personal', 'design', 'documents', 'media', 'presentation', 'archive', 'backup', 'photos', 'video', 'audio', 'text', 'proposal', 'assets', 'notes', 'music'];

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

  const handleDelete = (fileName: string) => {
    toast({
      title: "Moved to trash",
      description: `${fileName} has been moved to trash`,
    });
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
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    const newFolder: FileItem = {
      id: Date.now(),
      name: newFolderName,
      type: "folder",
      size: "0 files",
      modified: "Just now",
      icon: Folder,
      folder: "Root",
      tags: [],
      confidentiality: "internal",
      importance: "medium",
      allowSharing: true
    };

    setFiles(prev => [newFolder, ...prev]);
    setNewFolderName('');
    setShowCreateFolder(false);
    
    toast({
      title: "Folder created",
      description: `"${newFolderName}" folder has been created`,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    
    // Simulate upload progress
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

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, uploadProgress: progress } : f
        ));
      }

      // Mark upload as complete
      setFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, isUploading: false, uploadProgress: undefined } : f
      ));
    }

    setIsUploading(false);
    setSelectedFiles([]);
    setShowUploadModal(false);
    
    toast({
      title: "Upload complete",
      description: `${selectedFiles.length} file(s) uploaded successfully`,
    });
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
    <div className="h-full flex flex-col space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Files</h1>
          <p className="text-sm text-muted-foreground">2.4 GB used of 15 GB</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Enter a name for the new folder.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>
                  Create Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            className="gap-1"
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

      {/* Compact Storage & Upload Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Storage Usage - Compact */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Storage</span>
              <Badge variant="outline" className="text-xs">84% Free</Badge>
            </div>
            <Progress value={16} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>2.4 GB</span>
              <span>15 GB</span>
            </div>
          </CardContent>
        </Card>

        {/* Upload Zone - Compact */}
        <Card 
          className="lg:col-span-2 border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">Drop files to upload</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <SortDesc className="h-4 w-4 mr-1" />
            Sort
          </Button>
          <div className="flex border rounded-md">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none h-9 w-9 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none h-9 w-9 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Files Grid/List - Flexible Height */}
      <Card className="flex-1 min-h-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Files</CardTitle>
        </CardHeader>
        <CardContent className="h-full overflow-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {files.map((file) => {
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
              {files.map((file) => {
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