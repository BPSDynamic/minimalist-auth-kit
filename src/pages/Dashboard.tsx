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
    <div className="h-full flex flex-col space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Files</h1>
          <p className="text-sm text-muted-foreground">2.4 GB used of 15 GB</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <Button size="sm" className="gap-1">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
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
        <Card className="lg:col-span-2 border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
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
    </div>
  );
}