import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { s3Service, FileMetadata } from '@/lib/s3Service';
import { 
  Download, 
  Trash2, 
  Share2, 
  MoreVertical, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText,
  Archive,
  Calendar,
  User
} from 'lucide-react';

interface FileManagerProps {
  folderId?: string;
  onFileDeleted?: (fileId: string) => void;
  className?: string;
}

interface FileItem extends FileMetadata {
  s3Key: string;
  lastModified?: string;
}

export const FileManager = ({ 
  folderId, 
  onFileDeleted, 
  className = '' 
}: FileManagerProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, [folderId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const result = await s3Service.listFiles(folderId);
      if (result.success && result.files) {
        // Convert S3 items to FileItem format
        const fileItems: FileItem[] = result.files.map((item: any) => ({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.key.split('/').pop() || 'Unknown',
          type: getFileTypeFromName(item.key),
          size: item.size || 0,
          s3Key: item.key,
          folderId,
          tags: [],
          confidentiality: 'internal',
          importance: 'medium',
          allowSharing: true,
          createdAt: item.lastModified || new Date().toISOString(),
          updatedAt: item.lastModified || new Date().toISOString(),
          lastModified: item.lastModified,
        }));
        setFiles(fileItems);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeFromName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'avi': 'video/avi',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
    };
    return typeMap[extension || ''] || 'application/octet-stream';
  };

  const handleDownload = async (file: FileItem) => {
    setDownloadingFiles(prev => new Set(prev).add(file.id));
    
    try {
      const result = await s3Service.downloadFile(file.s3Key);
      
      if (result.success && result.blob) {
        // Create download link
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download started",
          description: `${file.name} is being downloaded`,
        });
      } else {
        toast({
          title: "Download failed",
          description: result.error || "Failed to download file",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (file: FileItem) => {
    try {
      const result = await s3Service.deleteFile(file.s3Key);
      
      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        onFileDeleted?.(file.id);
        
        toast({
          title: "File deleted",
          description: `${file.name} has been deleted`,
        });
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (file: FileItem) => {
    try {
      const result = await s3Service.getFileUrl(file.s3Key, 86400); // 24 hour expiry
      
      if (result.success && result.url) {
        // Copy to clipboard
        await navigator.clipboard.writeText(result.url);
        
        toast({
          title: "Share link copied",
          description: "Share link has been copied to clipboard (valid for 24 hours)",
        });
      } else {
        toast({
          title: "Share failed",
          description: result.error || "Failed to generate share link",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Share failed",
        description: error.message || "Failed to generate share link",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music className="h-5 w-5 text-green-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-5 w-5 text-orange-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

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

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No files in this folder</p>
            <p className="text-sm">Upload files to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Files ({files.length})</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadFiles}
          >
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file.type)}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{s3Service.formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getConfidentialityColor(file.confidentiality || 'internal')}`}
                    >
                      {file.confidentiality || 'internal'}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getImportanceColor(file.importance || 'medium')}`}
                    >
                      {file.importance || 'medium'}
                    </Badge>
                    {file.tags && file.tags.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {file.tags.length} tag(s)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFiles.has(file.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(file)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(file)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(file)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
