import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { s3Service, UploadOptions, FileMetadata } from '@/lib/s3Service';
import { Upload, X, File, CheckCircle, AlertCircle, CloudUpload } from 'lucide-react';

interface FileUploadProps {
  folderId?: string;
  onUploadComplete?: (files: FileMetadata[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  className?: string;
  metadata?: {
    tags?: string[];
    confidentiality?: 'public' | 'internal' | 'confidential' | 'restricted';
    importance?: 'low' | 'medium' | 'high' | 'critical';
    allowSharing?: boolean;
  };
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  metadata?: FileMetadata;
}

export const FileUpload = ({
  folderId,
  onUploadComplete,
  maxFiles = 10,
  maxSizeInMB = 100,
  allowedTypes = ['*'],
  className = '',
  metadata,
}: FileUploadProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFiles(acceptedFiles);
  }, [folderId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSizeInMB * 1024 * 1024,
    accept: allowedTypes.includes('*') ? undefined : Object.fromEntries(
      allowedTypes.map(type => [type, []])
    ),
    disabled: isUploading,
  });

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      if (!s3Service.validateFileType(file, allowedTypes)) {
        invalidFiles.push(`${file.name} - Invalid file type`);
      } else if (!s3Service.validateFileSize(file, maxSizeInMB)) {
        invalidFiles.push(`${file.name} - File too large (max ${maxSizeInMB}MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files",
        description: invalidFiles.join(', '),
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);

    // Initialize uploading files state
    const initialUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));
    setUploadingFiles(initialUploadingFiles);

    const uploadedFiles: FileMetadata[] = [];

    // Upload files one by one
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        const uploadOptions: UploadOptions = {
          folderId,
          tags: metadata?.tags,
          confidentiality: metadata?.confidentiality,
          importance: metadata?.importance,
          allowSharing: metadata?.allowSharing,
          onProgress: (progress) => {
            setUploadingFiles(prev => 
              prev.map((uploadingFile, index) => 
                index === i 
                  ? { ...uploadingFile, progress: progress.percentage }
                  : uploadingFile
              )
            );
          },
        };

        const result = await s3Service.uploadFile(file, uploadOptions);

        if (result.success && result.fileMetadata) {
          setUploadingFiles(prev => 
            prev.map((uploadingFile, index) => 
              index === i 
                ? { 
                    ...uploadingFile, 
                    progress: 100, 
                    status: 'completed',
                    metadata: result.fileMetadata
                  }
                : uploadingFile
            )
          );
          uploadedFiles.push(result.fileMetadata);
        } else {
          setUploadingFiles(prev => 
            prev.map((uploadingFile, index) => 
              index === i 
                ? { 
                    ...uploadingFile, 
                    status: 'error',
                    error: result.error
                  }
                : uploadingFile
            )
          );
        }
      } catch (error: any) {
        setUploadingFiles(prev => 
          prev.map((uploadingFile, index) => 
            index === i 
              ? { 
                  ...uploadingFile, 
                  status: 'error',
                  error: error.message
                }
              : uploadingFile
          )
        );
      }
    }

    setIsUploading(false);

    if (uploadedFiles.length > 0) {
      toast({
        title: "Upload complete",
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
      onUploadComplete?.(uploadedFiles);
    }

    // Clear uploading files after 3 seconds
    setTimeout(() => {
      setUploadingFiles([]);
    }, 3000);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              accept={allowedTypes.includes('*') ? undefined : allowedTypes.join(',')}
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                {isDragActive ? (
                  <CloudUpload className="h-8 w-8 text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragActive ? 'Drop files here' : 'Upload files'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or{' '}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="text-primary hover:underline"
                    disabled={isUploading}
                  >
                    browse
                  </button>
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">Max {maxFiles} files</Badge>
                  <Badge variant="secondary">Max {maxSizeInMB}MB each</Badge>
                  {allowedTypes.length > 0 && !allowedTypes.includes('*') && (
                    <Badge variant="secondary">
                      {allowedTypes.length} type(s) allowed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">Uploading Files</h4>
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {uploadingFile.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : uploadingFile.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <File className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {uploadingFile.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {s3Service.formatFileSize(uploadingFile.file.size)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadingFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {uploadingFile.status === 'uploading' && (
                      <Progress 
                        value={uploadingFile.progress} 
                        className="mt-1 h-1"
                      />
                    )}
                    
                    {uploadingFile.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">
                        {uploadingFile.error}
                      </p>
                    )}
                    
                    {uploadingFile.status === 'completed' && (
                      <p className="text-xs text-green-500 mt-1">
                        Upload complete
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
