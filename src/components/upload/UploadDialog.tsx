import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from './FileUpload';
import { FileMetadata } from '@/lib/s3Service';
import { Upload, X } from 'lucide-react';

interface UploadDialogProps {
  folderId?: string;
  onUploadComplete?: (files: FileMetadata[]) => void;
  trigger?: React.ReactNode;
}

export const UploadDialog = ({ 
  folderId, 
  onUploadComplete,
  trigger 
}: UploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [confidentiality, setConfidentiality] = useState<'public' | 'internal' | 'confidential' | 'restricted'>('internal');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [allowSharing, setAllowSharing] = useState(true);

  const handleUploadComplete = (files: FileMetadata[]) => {
    onUploadComplete?.(files);
    setOpen(false);
    // Reset form
    setTags([]);
    setNewTag('');
    setConfidentiality('internal');
    setImportance('medium');
    setAllowSharing(true);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload files to your cloud storage with custom settings and metadata.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File Upload Component */}
          <FileUpload
            folderId={folderId}
            onUploadComplete={handleUploadComplete}
            maxFiles={10}
            maxSizeInMB={100}
            allowedTypes={['*']}
            metadata={{
              tags,
              confidentiality,
              importance,
              allowSharing
            }}
          />
          
          {/* File Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">File Settings</h3>
            
            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex space-x-2">
                <Input
                  id="tags"
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* Confidentiality Level */}
            <div className="space-y-2">
              <Label htmlFor="confidentiality">Confidentiality Level</Label>
              <Select value={confidentiality} onValueChange={(value: any) => setConfidentiality(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select confidentiality level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can access</SelectItem>
                  <SelectItem value="internal">Internal - Company use only</SelectItem>
                  <SelectItem value="confidential">Confidential - Restricted access</SelectItem>
                  <SelectItem value="restricted">Restricted - Highly sensitive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Importance Level */}
            <div className="space-y-2">
              <Label htmlFor="importance">Importance Level</Label>
              <Select value={importance} onValueChange={(value: any) => setImportance(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select importance level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Standard priority</SelectItem>
                  <SelectItem value="medium">Medium - Normal priority</SelectItem>
                  <SelectItem value="high">High - Important</SelectItem>
                  <SelectItem value="critical">Critical - Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Allow Sharing */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowSharing"
                checked={allowSharing}
                onCheckedChange={(checked) => setAllowSharing(checked as boolean)}
              />
              <Label htmlFor="allowSharing">Allow sharing of these files</Label>
            </div>
          </div>
          
          {/* Upload Guidelines */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Upload Guidelines</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Maximum file size: 100MB per file</li>
              <li>• Maximum files per upload: 10 files</li>
              <li>• Supported formats: All file types</li>
              <li>• Files are automatically organized by folder</li>
              <li>• Upload progress is shown in real-time</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
