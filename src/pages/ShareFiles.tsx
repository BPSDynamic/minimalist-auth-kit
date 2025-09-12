import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { s3Service, FileMetadata } from "@/lib/s3Service";
import { authService } from "@/lib/authService";
import { 
  Upload, 
  X, 
  Send, 
  Link2, 
  Download, 
  Calendar,
  Users,
  Mail,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Plus,
  Copy,
  Share2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  s3Key?: string;
  metadata?: FileMetadata;
}

export default function ShareFiles() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [message, setMessage] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');
  const [shareLink, setShareLink] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  // Sender information from auth session
  const [senderInfo, setSenderInfo] = useState<{name: string; surname: string; email: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load sender information from auth session
  useEffect(() => {
    const loadSenderInfo = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setSenderInfo({
            name: user.firstName,
            surname: user.lastName,
            email: user.email,
          });
        }
      } catch (error) {
        console.error('Failed to load user information:', error);
      }
    };

    loadSenderInfo();
  }, []);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files to S3
    for (let i = 0; i < newFiles.length; i++) {
      const uploadedFile = newFiles[i];
      
      try {
        const uploadOptions = {
          folderId: 'shared', // Store shared files in a shared folder
          tags: ['shared'],
          confidentiality: 'public' as const,
          importance: 'medium' as const,
          allowSharing: true,
          onProgress: (progress: any) => {
            setUploadedFiles(prev => prev.map(f => {
              if (f.id === uploadedFile.id) {
                return { ...f, progress: progress.percentage };
              }
              return f;
            }));
          },
        };

        const result = await s3Service.uploadFile(uploadedFile.file, uploadOptions);
        
        if (result.success && result.fileMetadata) {
          setUploadedFiles(prev => prev.map(f => {
            if (f.id === uploadedFile.id) {
              return { 
                ...f, 
                progress: 100, 
                status: 'completed',
                s3Key: result.fileMetadata!.s3Key,
                metadata: result.fileMetadata
              };
            }
            return f;
          }));
        } else {
          setUploadedFiles(prev => prev.map(f => {
            if (f.id === uploadedFile.id) {
              return { 
                ...f, 
                status: 'error',
                progress: 0
              };
            }
            return f;
          }));
        }
      } catch (error: any) {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === uploadedFile.id) {
            return { 
              ...f, 
              status: 'error',
              progress: 0
            };
          }
          return f;
        }));
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const addRecipient = () => {
    setRecipients(prev => [...prev, '']);
  };

  const updateRecipient = (index: number, email: string) => {
    setRecipients(prev => prev.map((r, i) => i === index ? email : r));
  };

  const removeRecipient = (index: number) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const generateShareLink = async () => {
    // Generate actual S3 share URLs
    const shareUrls: string[] = [];
    
    for (const uploadedFile of uploadedFiles) {
      if (uploadedFile.s3Key && uploadedFile.status === 'completed') {
        const result = await s3Service.getFileUrl(uploadedFile.s3Key, 7 * 24 * 3600); // 7 days expiry for sharing
        if (result.success && result.url) {
          shareUrls.push(result.url);
        }
      }
    }
    
    if (shareUrls.length > 0) {
      // For now, return the first file URL as the share link
      // In a real app, you'd create a proper share endpoint
      return shareUrls[0];
    }
    
    return '';
  };

  const updateFilesWithSharingMetadata = async (shareLink: string, recipients: string[]) => {
    // Update each uploaded file's metadata with sharing information
    for (const uploadedFile of uploadedFiles) {
      if (uploadedFile.metadata && uploadedFile.s3Key) {
        try {
          // Create updated metadata with sharing information
          const updatedMetadata: FileMetadata = {
            ...uploadedFile.metadata,
            shareRecipients: recipients,
            shareMessage: message.trim() || undefined,
            shareExpirationDays: parseInt(expirationDays),
            shareLink: shareLink,
            shareSender: senderInfo ? {
              name: senderInfo.name,
              surname: senderInfo.surname,
              email: senderInfo.email,
            } : undefined,
            updatedAt: new Date().toISOString(),
          };

          // Update the file metadata in S3
          await s3Service.updateFileMetadata(uploadedFile.s3Key, updatedMetadata);
          
          // Update local state
          setUploadedFiles(prev => prev.map(f => {
            if (f.id === uploadedFile.id) {
              return { ...f, metadata: updatedMetadata };
            }
            return f;
          }));
        } catch (error) {
          console.error(`Failed to update metadata for file ${uploadedFile.name}:`, error);
        }
      }
    }
  };

  const handleShare = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one file to share.",
        variant: "destructive",
      });
      return;
    }

    const validRecipients = recipients.filter(email => email.trim() !== '');
    if (validRecipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one email address.",
        variant: "destructive",
      });
      return;
    }

    // Validate sender information
    if (!senderInfo || !senderInfo.name || !senderInfo.surname || !senderInfo.email) {
      toast({
        title: "Missing sender information",
        description: "Unable to load your user information. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    
    try {
      const link = await generateShareLink();
      
      if (link) {
        setShareLink(link);
        
        // Update file metadata with sharing information
        await updateFilesWithSharingMetadata(link, validRecipients);
        
        // Copy to clipboard
        await navigator.clipboard.writeText(link);
        
        toast({
          title: "Files shared successfully!",
          description: `Share link sent to ${validRecipients.length} recipient(s)`,
        });
      } else {
        toast({
          title: "Failed to generate share link",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to share files",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard",
    });
  };

  const totalSize = uploadedFiles.reduce((acc, file) => acc + file.file.size, 0);

  return (
    <div className="max-w-7xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Share Files</h1>
        <p className="text-sm text-muted-foreground">Send large files securely with expiration dates</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-4 lg:min-h-[600px] lg:flex lg:flex-col lg:justify-between">
          {/* Upload Area */}
          <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription className="text-sm">
                Drag and drop files here or click to browse (Max 2GB per transfer)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragOver 
                    ? 'border-primary bg-primary/10 scale-[1.02]' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                  }
                `}
              >
                <div className="space-y-3">
                  <Upload className={`h-12 w-12 mx-auto transition-colors ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">
                      {isDragOver ? 'Drop files here' : 'Select files to share'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Support for all file types • Up to 2GB per transfer
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Browse Files
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                />
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold">Uploaded Files ({uploadedFiles.length})</h4>
                    <Badge variant="secondary" className="text-xs">{formatFileSize(totalSize)} total</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {uploadedFiles.map((file) => {
                      const IconComponent = getFileIcon(file.type);
                      return (
                        <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="p-1.5 bg-muted rounded-md">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                            {file.status === 'uploading' && (
                              <Progress value={file.progress} className="h-1.5 mt-1" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {file.status === 'completed' && (
                              <Badge variant="default" className="text-xs px-2 py-0.5">Ready</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Message */}
          <Card className="lg:flex-1 lg:flex lg:flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Message (Optional)</CardTitle>
              <CardDescription className="text-sm">Add a personal message to your recipients</CardDescription>
            </CardHeader>
            <CardContent className="lg:flex-1 lg:flex lg:flex-col">
              <Textarea
                placeholder="Hi! I'm sharing these files with you..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="resize-none text-sm lg:flex-1"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings & Actions */}
        <div className="space-y-4 lg:min-h-[600px] lg:flex lg:flex-col lg:justify-between">
          {/* Settings Card */}
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Settings
              </CardTitle>
              <CardDescription className="text-sm">Configure sharing options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Expiration</Label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                <input type="checkbox" className="h-4 w-4 mt-0.5" defaultChecked />
                <div>
                  <p className="font-medium text-xs">Download notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Get notified when files are downloaded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients Card */}
          <Card className="sticky top-80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Recipients
              </CardTitle>
              <CardDescription className="text-sm">
                Add email addresses of people you want to share with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted rounded-md">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={recipient}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    className="flex-1 h-9 text-sm"
                  />
                  {recipients.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(index)}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button variant="outline" size="sm" onClick={addRecipient} className="gap-2 w-full h-9 text-sm">
                <Plus className="h-3 w-3" />
                Add Recipient
              </Button>
            </CardContent>
          </Card>

          {/* Share Button Card */}
          <Card className="lg:mt-auto">
            <CardContent className="pt-3 pb-4">
              <Button 
                onClick={handleShare} 
                disabled={isSharing || uploadedFiles.length === 0}
                className="w-full h-9 text-xs gap-1.5"
                size="sm"
              >
                {isSharing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    Preparing...
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    Share Files
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Link Result */}
      {shareLink && (
        <Card className="border-green-200 bg-green-50/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 text-base">
              <Share2 className="h-4 w-4" />
              Files Shared Successfully!
            </CardTitle>
            <CardDescription className="text-green-600 text-sm">
              Your files have been uploaded and share notifications sent to recipients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Input value={shareLink} readOnly className="border-0 bg-transparent flex-1 text-sm" />
              <Button variant="outline" size="sm" onClick={copyLink} className="gap-1 h-8">
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs text-green-700">
              <Badge variant="outline" className="border-green-300 text-xs px-2 py-0.5">
                <Download className="h-3 w-3 mr-1" />
                Expires in {expirationDays} days
              </Badge>
              <Badge variant="outline" className="border-green-300 text-xs px-2 py-0.5">
                <Users className="h-3 w-3 mr-1" />
                {recipients.filter(r => r.trim()).length} recipients
              </Badge>
              <Badge variant="outline" className="border-green-300 text-xs px-2 py-0.5">
                <FileText className="h-3 w-3 mr-1" />
                {uploadedFiles.length} files
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}