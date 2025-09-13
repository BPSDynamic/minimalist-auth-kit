import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Shield, 
  HardDrive, 
  Bell, 
  Settings, 
  Download,
  Upload,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { lambdaService } from "@/lib/lambdaService";
import { authService } from "@/lib/authService";

interface AnalyticsData {
  totalEvents: number;
  eventsByType: Record<string, number>;
  storageUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  topFiles: Array<{
    fileName: string;
    downloadCount: number;
  }>;
  recentActivity: Array<{
    eventType: string;
    timestamp: string;
    data: any;
  }>;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    lastCheck: string;
  }>;
}

export default function EnterpriseDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Load analytics
        const analyticsResult = await lambdaService.getAnalyticsReport(currentUser.id);
        if (analyticsResult.success && analyticsResult.report) {
          setAnalytics(analyticsResult.report);
        }
      }

      // Mock system health data (in real app, this would come from a health check service)
      setSystemHealth({
        status: 'healthy',
        services: [
          { name: 'File Processing', status: 'up', lastCheck: new Date().toISOString() },
          { name: 'Notification Service', status: 'up', lastCheck: new Date().toISOString() },
          { name: 'Analytics Service', status: 'up', lastCheck: new Date().toISOString() },
          { name: 'Backup Service', status: 'up', lastCheck: new Date().toISOString() },
        ],
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      if (!user) return;
      
      const result = await lambdaService.performBackup({
        action: 'backup',
        userId: user.id,
      });

      if (result.success) {
        alert(`Backup completed successfully! Backup ID: ${result.backupId}`);
      } else {
        alert(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Backup error:', error);
      alert('Backup failed');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'degraded': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return <CheckCircle className="h-4 w-4" />;
      case 'down': return <AlertTriangle className="h-4 w-4" />;
      case 'degraded': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading enterprise dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Dashboard</h1>
          <p className="text-muted-foreground">Monitor your CloudVault enterprise services</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleBackup} variant="outline">
            <HardDrive className="h-4 w-4 mr-2" />
            Backup Now
          </Button>
          <Button onClick={loadDashboardData} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All services operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? formatBytes(analytics.storageUsage.used) : '0 Bytes'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics ? `${analytics.storageUsage.percentage}% of limit` : '0% of limit'}
            </p>
            {analytics && (
              <Progress value={analytics.storageUsage.percentage} className="mt-2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? analytics.totalEvents.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">All time activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Event Types */}
            <Card>
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.eventsByType ? (
                  <div className="space-y-2">
                    {Object.entries(analytics.eventsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Top Files */}
            <Card>
              <CardHeader>
                <CardTitle>Most Downloaded Files</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topFiles && analytics.topFiles.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.topFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm truncate">{file.fileName}</span>
                        <Badge variant="outline">{file.downloadCount} downloads</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No downloads yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Storage Used</span>
                    <span className="font-mono">{formatBytes(analytics.storageUsage.used)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage Limit</span>
                    <span className="font-mono">{formatBytes(analytics.storageUsage.limit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Usage Percentage</span>
                    <span className="font-mono">{analytics.storageUsage.percentage}%</span>
                  </div>
                  <Progress value={analytics.storageUsage.percentage} className="w-full" />
                </div>
              ) : (
                <p className="text-muted-foreground">No storage data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
            </CardHeader>
            <CardContent>
              {systemHealth?.services ? (
                <div className="space-y-3">
                  {systemHealth.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Last check: {new Date(service.lastCheck).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={service.status === 'up' ? 'default' : 'destructive'}
                        className={getStatusColor(service.status)}
                      >
                        {service.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No service data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Authentication</p>
                      <p className="text-sm text-muted-foreground">Cognito User Pool</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-green-600">SECURE</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">File Encryption</p>
                      <p className="text-sm text-muted-foreground">AES-256 encryption at rest</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-green-600">ENCRYPTED</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Backup Status</p>
                      <p className="text-sm text-muted-foreground">Automated daily backups</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-green-600">ACTIVE</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
