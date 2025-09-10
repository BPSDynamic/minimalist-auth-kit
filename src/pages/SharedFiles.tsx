import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Download, 
  Link2, 
  Calendar, 
  Users, 
  MoreHorizontal,
  Copy,
  Share2,
  Trash2,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface SharedTransfer {
  id: string;
  name: string;
  files: Array<{
    name: string;
    type: string;
    size: string;
  }>;
  recipients: string[];
  message?: string;
  createdAt: string;
  expiresAt: string;
  downloads: number;
  maxDownloads?: number;
  status: 'active' | 'expired' | 'deleted';
  shareLink: string;
}

export default function SharedFiles() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  // Mock shared transfers data
  const sharedTransfers: SharedTransfer[] = [
    {
      id: '1',
      name: 'Project Assets',
      files: [
        { name: 'design-mockups.figma', type: 'application/figma', size: '12.4 MB' },
        { name: 'logo-variants.zip', type: 'application/zip', size: '8.2 MB' },
        { name: 'brand-guidelines.pdf', type: 'application/pdf', size: '3.1 MB' }
      ],
      recipients: ['john@company.com', 'sarah@agency.com'],
      message: 'Here are the latest design assets for the project. Let me know if you need any changes!',
      createdAt: '2024-01-15T10:30:00Z',
      expiresAt: '2024-01-22T10:30:00Z',
      downloads: 3,
      maxDownloads: 10,
      status: 'active',
      shareLink: 'https://cloudvault.app/share/abc123def456'
    },
    {
      id: '2',
      name: 'Presentation Materials',
      files: [
        { name: 'quarterly-review.pptx', type: 'application/vnd.ms-powerpoint', size: '45.2 MB' },
        { name: 'charts-data.xlsx', type: 'application/vnd.ms-excel', size: '2.8 MB' }
      ],
      recipients: ['team@company.com'],
      createdAt: '2024-01-10T14:20:00Z',
      expiresAt: '2024-01-17T14:20:00Z',
      downloads: 8,
      status: 'active',
      shareLink: 'https://cloudvault.app/share/xyz789ghi012'
    },
    {
      id: '3',
      name: 'Media Package',
      files: [
        { name: 'product-video.mp4', type: 'video/mp4', size: '156.7 MB' },
        { name: 'product-images.zip', type: 'application/zip', size: '89.3 MB' }
      ],
      recipients: ['marketing@company.com', 'pr@agency.com', 'social@company.com'],
      message: 'Latest product media assets for the campaign launch.',
      createdAt: '2024-01-05T09:15:00Z',
      expiresAt: '2024-01-05T09:15:00Z',
      downloads: 12,
      status: 'expired',
      shareLink: 'https://cloudvault.app/share/def456ghi789'
    }
  ];

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return Image;
    if (type.includes('video')) return Video;
    if (type.includes('audio')) return Music;
    if (type.includes('pdf') || type.includes('document') || type.includes('presentation') || type.includes('excel')) return FileText;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    return File;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'deleted':
        return <Badge variant="secondary">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const copyShareLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard",
    });
  };

  const activeTransfers = sharedTransfers.filter(t => t.status === 'active');
  const expiredTransfers = sharedTransfers.filter(t => t.status === 'expired');
  const allTransfers = sharedTransfers;

  const renderTransferCard = (transfer: SharedTransfer) => (
    <Card key={transfer.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{transfer.name}</CardTitle>
              {getStatusBadge(transfer.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(transfer.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {transfer.recipients.length}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {transfer.downloads}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copyShareLink(transfer.shareLink)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Files - Simplified */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {transfer.files.slice(0, 3).map((file, index) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <div key={index} className="w-6 h-6 bg-muted rounded border border-background flex items-center justify-center">
                  <IconComponent className="h-3 w-3 text-muted-foreground" />
                </div>
              );
            })}
            {transfer.files.length > 3 && (
              <div className="w-6 h-6 bg-muted rounded border border-background flex items-center justify-center text-xs font-medium">
                +{transfer.files.length - 3}
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{transfer.files.length} files</span>
        </div>

        {/* Share Link - Simplified */}
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
          <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <code className="flex-1 text-xs font-mono truncate text-muted-foreground">
            {transfer.shareLink.split('/').pop()}
          </code>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => copyShareLink(transfer.shareLink)}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* Expiration - Simplified */}
        <div className="text-xs text-muted-foreground">
          {transfer.status === 'expired' ? 'Expired' : 'Expires'} {formatDate(transfer.expiresAt)}
          {transfer.maxDownloads && ` • ${transfer.downloads}/${transfer.maxDownloads} downloads`}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shared Files</h1>
          <p className="text-muted-foreground">Manage your file transfers and shared links</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Transfer
        </Button>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transfers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active ({activeTransfers.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredTransfers.length})</TabsTrigger>
          <TabsTrigger value="all">All ({allTransfers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTransfers.length > 0 ? (
            <div className="grid gap-4">
              {activeTransfers.map(renderTransferCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active transfers</h3>
              <p className="text-muted-foreground mb-4">Create your first file transfer to get started</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Share Files
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {expiredTransfers.length > 0 ? (
            <div className="grid gap-4">
              {expiredTransfers.map(renderTransferCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expired transfers</h3>
              <p className="text-muted-foreground">Your expired transfers will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {allTransfers.map(renderTransferCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}