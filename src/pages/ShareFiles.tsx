import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
}

export default function ShareFiles() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [message, setMessage] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');
  const [shareLink, setShareLink] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleFileSelect = useCallback((files: FileList) => {
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

    // Simulate upload progress
    newFiles.forEach(uploadedFile => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === uploadedFile.id) {
            if (f.progress >= 100) {
              clearInterval(interval);
              return { ...f, progress: 100, status: 'completed' };
            }
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 200);
    });
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

  const generateShareLink = () => {
    // Mock share link generation
    const linkId = Math.random().toString(36).substr(2, 12);
    return `https://cloudvault.app/share/${linkId}`;
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

    setIsSharing(true);
    
    // Simulate sharing process
    setTimeout(() => {
      const link = generateShareLink();
      setShareLink(link);
      setIsSharing(false);
      
      toast({
        title: "Files shared successfully!",
        description: `Share link sent to ${validRecipients.length} recipient(s)`,
      });
    }, 2000);
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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Share Files</h1>
        <p className="text-muted-foreground">Send large files securely with expiration dates</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
          <CardDescription>
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
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
            `}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragOver ? 'Drop files here' : 'Select files to share'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Support for all file types • Up to 2GB per transfer
            </p>
            <Button variant="outline">Browse Files</Button>
            
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
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Uploaded Files ({uploadedFiles.length})</h4>
                <Badge variant="outline">{formatFileSize(totalSize)} total</Badge>
              </div>
              
              <div className="space-y-3">
                {uploadedFiles.map((file) => {
                  const IconComponent = getFileIcon(file.type);
                  return (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{file.size}</p>
                        {file.status === 'uploading' && (
                          <Progress value={file.progress} className="h-1 mt-1" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'completed' && (
                          <Badge variant="secondary" className="text-xs">Ready</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
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

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recipients
          </CardTitle>
          <CardDescription>
            Add email addresses of people you want to share with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recipients.map((recipient, index) => (
            <div key={index} className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter email address"
                value={recipient}
                onChange={(e) => updateRecipient(index, e.target.value)}
                className="flex-1"
              />
              {recipients.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRecipient(index)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addRecipient} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Recipient
          </Button>
        </CardContent>
      </Card>

      {/* Message & Settings */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Message (Optional)</CardTitle>
            <CardDescription>Add a personal message to your recipients</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Hi! I'm sharing these files with you..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>Configure sharing options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select value={expirationDays} onValueChange={setExpirationDays}>
                <SelectTrigger>
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

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Download notifications</p>
                <p className="text-xs text-muted-foreground">Get notified when files are downloaded</p>
              </div>
              <input type="checkbox" className="h-4 w-4" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleShare} 
            disabled={isSharing || uploadedFiles.length === 0}
            className="w-full h-12 text-lg gap-2"
            size="lg"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Preparing Share...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Share Files
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Share Link Result */}
      {shareLink && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Share2 className="h-5 w-5" />
              Files Shared Successfully!
            </CardTitle>
            <CardDescription className="text-green-600">
              Your files have been uploaded and share notifications sent to recipients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Input value={shareLink} readOnly className="border-0 bg-transparent flex-1" />
              <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 text-sm text-green-700">
              <Badge variant="outline" className="border-green-300">
                <Download className="h-3 w-3 mr-1" />
                Expires in {expirationDays} days
              </Badge>
              <Badge variant="outline" className="border-green-300">
                <Users className="h-3 w-3 mr-1" />
                {recipients.filter(r => r.trim()).length} recipients
              </Badge>
              <Badge variant="outline" className="border-green-300">
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