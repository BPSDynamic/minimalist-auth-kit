import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Trash2,
  RotateCcw,
  Delete,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Folder,
  Calendar,
  MoreHorizontal,
  Undo2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TrashItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  fileType?: string;
  size: string;
  deletedAt: string;
  originalPath: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Trash() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Mock trash data
  const trashItems: TrashItem[] = [
    {
      id: '1',
      name: 'Old Project Files',
      type: 'folder',
      size: '45.2 MB',
      deletedAt: '2024-01-20T10:30:00Z',
      originalPath: '/Projects/Old Project',
      icon: Folder
    },
    {
      id: '2',
      name: 'draft-document.pdf',
      type: 'file',
      fileType: 'pdf',
      size: '2.1 MB',
      deletedAt: '2024-01-19T14:20:00Z',
      originalPath: '/Documents/Drafts',
      icon: FileText
    },
    {
      id: '3',
      name: 'temp-image.jpg',
      type: 'file',
      fileType: 'image',
      size: '1.8 MB',
      deletedAt: '2024-01-18T09:15:00Z',
      originalPath: '/Images/Temp',
      icon: Image
    },
    {
      id: '4',
      name: 'backup-data.zip',
      type: 'file',
      fileType: 'archive',
      size: '156.7 MB',
      deletedAt: '2024-01-17T16:45:00Z',
      originalPath: '/Backups',
      icon: Archive
    },
    {
      id: '5',
      name: 'meeting-recording.mp4',
      type: 'file',
      fileType: 'video',
      size: '89.3 MB',
      deletedAt: '2024-01-16T11:30:00Z',
      originalPath: '/Recordings/Meetings',
      icon: Video
    }
  ];

  const getFileIcon = (type: string, fileType?: string) => {
    if (type === 'folder') return Folder;
    if (fileType === 'image') return Image;
    if (fileType === 'video') return Video;
    if (fileType === 'audio') return Music;
    if (fileType === 'pdf' || fileType === 'document') return FileText;
    if (fileType === 'archive') return Archive;
    return File;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const deleted = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const handleRestore = (item: TrashItem) => {
    toast({
      title: "Item restored",
      description: `${item.name} has been restored to ${item.originalPath}`,
    });
  };

  const handlePermanentDelete = (item: TrashItem) => {
    toast({
      title: "Item permanently deleted",
      description: `${item.name} has been permanently removed`,
      variant: "destructive",
    });
  };

  const handleEmptyTrash = () => {
    toast({
      title: "Trash emptied",
      description: "All items have been permanently deleted",
      variant: "destructive",
    });
  };

  const filteredItems = trashItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTrashItem = (item: TrashItem) => {
    const IconComponent = getFileIcon(item.type, item.fileType);
    
    return (
      <Card key={item.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-red-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">{item.name}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Deleted {getTimeAgo(item.deletedAt)}
                  </span>
                  <span>{item.size}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {item.originalPath}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRestore(item)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handlePermanentDelete(item)}
                  className="text-red-600"
                >
                  <Delete className="h-4 w-4 mr-2" />
                  Delete Forever
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trash</h1>
          <p className="text-muted-foreground">Manage your deleted files and folders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEmptyTrash} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Empty Trash
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deleted items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Trash Items */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} in trash
            </p>
            <Badge variant="outline" className="text-xs">
              Items are automatically deleted after 30 days
            </Badge>
          </div>
          <div className="grid gap-4">
            {filteredItems.map(renderTrashItem)}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No items found' : 'Trash is empty'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Deleted files and folders will appear here'
            }
          </p>
        </div>
      )}

      {/* Info Card */}
      {filteredItems.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Undo2 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-blue-900">Recovery Information</h4>
                <p className="text-sm text-blue-700">
                  Items in trash are automatically deleted after 30 days. You can restore items 
                  to their original location or delete them permanently.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
