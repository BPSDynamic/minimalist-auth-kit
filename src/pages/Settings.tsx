import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Globe,
  Palette,
  Database,
  Download,
  Trash2,
  Key,
  Monitor
} from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [appSettings, setAppSettings] = useState({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: 30,
    loginNotifications: true,
    suspiciousActivity: true,
  });

  const [dataSettings, setDataSettings] = useState({
    autoBackup: true,
    compressionLevel: 'medium',
    retentionPeriod: 90,
    exportFormat: 'zip',
  });

  const handleSaveSettings = async (section: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings updated",
        description: `${section} settings have been saved successfully.`,
      });
    }, 1000);
  };

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export will be ready for download shortly.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion requested",
      description: "Please check your email for confirmation instructions.",
      variant: "destructive",
    });
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and account settings.</p>
      </div>

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Customize your application experience and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="font-medium">Dark Mode</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="font-medium">Auto-save</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically save changes as you work
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-medium">Show file previews</span>
              <p className="text-sm text-muted-foreground">
                Display thumbnails for images and documents
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <Button onClick={() => handleSaveSettings('Application')} disabled={loading} className="gap-2">
            Save Application Settings
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="font-medium">Two-Factor Authentication</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={security.twoFactor}
              onCheckedChange={(checked) => 
                setSecurity(prev => ({ ...prev, twoFactor: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-medium">Login Notifications</span>
              <p className="text-sm text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Switch
              checked={security.loginNotifications}
              onCheckedChange={(checked) => 
                setSecurity(prev => ({ ...prev, loginNotifications: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-medium">Suspicious Activity Alerts</span>
              <p className="text-sm text-muted-foreground">
                Receive alerts for unusual account activity
              </p>
            </div>
            <Switch
              checked={security.suspiciousActivity}
              onCheckedChange={(checked) => 
                setSecurity(prev => ({ ...prev, suspiciousActivity: checked }))
              }
            />
          </div>

          <Button onClick={() => handleSaveSettings('Security')} disabled={loading} className="gap-2">
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Control how your data is stored, backed up, and managed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-medium">Automatic Backups</span>
              <p className="text-sm text-muted-foreground">
                Automatically backup your files to cloud storage
              </p>
            </div>
            <Switch
              checked={dataSettings.autoBackup}
              onCheckedChange={(checked) => 
                setDataSettings(prev => ({ ...prev, autoBackup: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-medium">File Compression</span>
              <p className="text-sm text-muted-foreground">
                Compress files to save storage space
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export All Data
              </Button>
            </div>
          </div>

          <Button onClick={() => handleSaveSettings('Data')} disabled={loading} className="gap-2">
            Save Data Settings
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-medium text-red-600">Delete Account</span>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
