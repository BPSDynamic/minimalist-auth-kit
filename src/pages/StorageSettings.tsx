import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  HardDrive, 
  Trash2, 
  Archive, 
  Zap,
  ArrowUp,
  Folder,
  File,
  Image,
  Video,
  Music
} from "lucide-react";

export default function StorageSettings() {
  const storageBreakdown = [
    {
      type: "Images",
      size: "1.2 GB",
      percentage: 48,
      color: "bg-green-500",
      icon: Image,
    },
    {
      type: "Videos",
      size: "800 MB",
      percentage: 32,
      color: "bg-purple-500",
      icon: Video,
    },
    {
      type: "Documents",
      size: "300 MB",
      percentage: 12,
      color: "bg-blue-500",
      icon: File,
    },
    {
      type: "Audio",
      size: "100 MB",
      percentage: 4,
      color: "bg-orange-500",
      icon: Music,
    },
    {
      type: "Other",
      size: "100 MB",
      percentage: 4,
      color: "bg-gray-500",
      icon: Folder,
    },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Storage Management</h1>
        <p className="text-muted-foreground">Monitor and manage your cloud storage usage.</p>
      </div>

      {/* Storage Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
            <CardDescription>
              2.5 GB used of 15 GB available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used Space</span>
                <span>2.5 GB / 15 GB</span>
              </div>
              <Progress value={16.7} className="h-3" />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Storage Breakdown</h4>
              {storageBreakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.size}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Trash2 className="h-4 w-4" />
                Empty Trash
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Archive className="h-4 w-4" />
                Compress Files
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Zap className="h-4 w-4" />
                Optimize Storage
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upgrade Storage</CardTitle>
              <CardDescription>
                Need more space? Upgrade your plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2">
                <ArrowUp className="h-4 w-4" />
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Storage Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Plans</CardTitle>
          <CardDescription>Choose the plan that fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Basic</h3>
                  <p className="text-2xl font-bold">15 GB</p>
                  <p className="text-sm text-muted-foreground">Free</p>
                </div>
                <Badge variant="secondary" className="w-fit">Current Plan</Badge>
                <ul className="text-sm space-y-1">
                  <li>• 15 GB storage</li>
                  <li>• Basic file sharing</li>
                  <li>• 30-day version history</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border rounded-lg border-primary bg-primary/5">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Pro</h3>
                  <p className="text-2xl font-bold">100 GB</p>
                  <p className="text-sm text-muted-foreground">$9.99/month</p>
                </div>
                <Badge className="w-fit">Recommended</Badge>
                <ul className="text-sm space-y-1">
                  <li>• 100 GB storage</li>
                  <li>• Advanced sharing</li>
                  <li>• 90-day version history</li>
                  <li>• Priority support</li>
                </ul>
                <Button className="w-full">Upgrade to Pro</Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Business</h3>
                  <p className="text-2xl font-bold">1 TB</p>
                  <p className="text-sm text-muted-foreground">$19.99/month</p>
                </div>
                <Badge variant="outline" className="w-fit">Enterprise</Badge>
                <ul className="text-sm space-y-1">
                  <li>• 1 TB storage</li>
                  <li>• Team collaboration</li>
                  <li>• Unlimited version history</li>
                  <li>• 24/7 support</li>
                  <li>• Advanced security</li>
                </ul>
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}