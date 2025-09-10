import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Mock data for files and folders
  const files = [
    {
      id: 1,
      name: "Project Proposal.pdf",
      type: "pdf",
      size: "2.4 MB",
      modified: "2 hours ago",
      icon: FileText,
      thumbnail: null
    },
    {
      id: 2,
      name: "Design Assets",
      type: "folder",
      size: "12 files",
      modified: "1 day ago",
      icon: Folder,
      thumbnail: null
    },
    {
      id: 3,
      name: "vacation-2024.jpg",
      type: "image",
      size: "4.2 MB",
      modified: "3 days ago",
      icon: Image,
      thumbnail: "/placeholder.svg"
    },
    {
      id: 4,
      name: "presentation.mp4",
      type: "video",
      size: "45.8 MB",
      modified: "1 week ago",
      icon: Video,
      thumbnail: null
    },
    {
      id: 5,
      name: "Documents",
      type: "folder",
      size: "24 files",
      modified: "2 weeks ago",
      icon: Folder,
      thumbnail: null
    },
    {
      id: 6,
      name: "audio-track.mp3",
      type: "audio",
      size: "8.1 MB",
      modified: "3 weeks ago",
      icon: Music,
      thumbnail: null
    },
    {
      id: 7,
      name: "backup.zip",
      type: "archive",
      size: "124 MB",
      modified: "1 month ago",
      icon: Archive,
      thumbnail: null
    },
    {
      id: 8,
      name: "notes.txt",
      type: "text",
      size: "1.2 KB",
      modified: "2 months ago",
      icon: FileText,
      thumbnail: null
    }
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

  const handleDelete = (fileName: string) => {
    toast({
      title: "Moved to trash",
      description: `${fileName} has been moved to trash`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Files</h1>
          <p className="text-muted-foreground">Manage and organize your files</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Storage Usage</h3>
              <p className="text-sm text-muted-foreground">2.4 GB used of 15 GB</p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              84% Available
            </Badge>
          </div>
          <Progress value={16} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>2.4 GB used</span>
            <span>15 GB total</span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop files to upload</h3>
            <p className="text-muted-foreground mb-4">or click to browse</p>
            <Button variant="outline">Choose Files</Button>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <SortDesc className="h-4 w-4 mr-2" />
            Sort
          </Button>
          <div className="flex border rounded-lg">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* File Grid/List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {files.map((file) => {
                const IconComponent = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="group relative p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`${getFileTypeColor(file.type)}`}>
                        <IconComponent className="h-12 w-12" />
                      </div>
                      <div className="w-full">
                        <p className="font-medium text-sm truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                        <p className="text-xs text-muted-foreground">{file.modified}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
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
            <div className="space-y-2">
              {files.map((file) => {
                const IconComponent = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={getFileTypeColor(file.type)}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">Modified {file.modified}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{file.size}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
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
    </div>
  );
}