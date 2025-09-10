import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  Link2, 
  Calendar, 
  Users, 
  MoreHorizontal,
  Eye,
  Copy,
  Share2,
  Trash2,
  ExternalLink,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File
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
  };

  const activeTransfers = sharedTransfers.filter(t => t.status === 'active');
  const expiredTransfers = sharedTransfers.filter(t => t.status === 'expired');
  const allTransfers = sharedTransfers;

  const renderTransferCard = (transfer: SharedTransfer) => (
    <Card key={transfer.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{transfer.name}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {formatDate(transfer.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {transfer.recipients.length} recipients
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {transfer.downloads} downloads
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(transfer.status)}
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
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Share Page
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Transfer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Files */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Files ({transfer.files.length})</h4>
          <div className="space-y-2">
            {transfer.files.slice(0, 3).map((file, index) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-muted-foreground">{file.size}</span>
                </div>
              );
            })}
            {transfer.files.length > 3 && (
              <div className="text-sm text-muted-foreground">
                +{transfer.files.length - 3} more files
              </div>
            )}
          </div>
        </div>

        {/* Recipients */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Recipients</h4>
          <div className="flex flex-wrap gap-1">
            {transfer.recipients.slice(0, 2).map((recipient, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {recipient}
              </Badge>
            ))}
            {transfer.recipients.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{transfer.recipients.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Message */}
        {transfer.message && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Message</h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded text-ellipsis line-clamp-2">
              {transfer.message}
            </p>
          </div>
        )}

        {/* Share Link */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <code className="flex-1 text-xs font-mono truncate">{transfer.shareLink}</code>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => copyShareLink(transfer.shareLink)}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* Expiration */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {transfer.status === 'expired' ? 'Expired' : 'Expires'} {formatDate(transfer.expiresAt)}
          </span>
          {transfer.maxDownloads && (
            <span className="text-muted-foreground">
              {transfer.downloads}/{transfer.maxDownloads} downloads
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shared Files</h1>
          <p className="text-muted-foreground">Manage your file transfers and shared links</p>
        </div>
        <Button className="gap-2">
          <Share2 className="h-4 w-4" />
          New Transfer
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
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
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active transfers</h3>
                <p className="text-muted-foreground mb-4">Create your first file transfer to get started</p>
                <Button>Share Files</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {expiredTransfers.length > 0 ? (
            <div className="grid gap-4">
              {expiredTransfers.map(renderTransferCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No expired transfers</h3>
                <p className="text-muted-foreground">Your expired transfers will appear here</p>
              </CardContent>
            </Card>
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