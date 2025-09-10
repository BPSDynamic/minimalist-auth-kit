import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, TrendingUp, Activity } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "2,847",
      change: "+12.5%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Revenue",
      value: "$24,521",
      change: "+8.2%",
      trend: "up",
      icon: BarChart3,
    },
    {
      title: "Growth Rate",
      value: "14.8%",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Active Sessions",
      value: "1,234",
      change: "-5.4%",
      trend: "down",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your account.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={stat.trend === "up" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
                <p className="text-xs text-muted-foreground">from last month</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest account activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Activity {i}</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="font-medium text-sm">Update Profile</div>
                <div className="text-xs text-muted-foreground">Manage your account information</div>
              </button>
              <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="font-medium text-sm">Generate Report</div>
                <div className="text-xs text-muted-foreground">Create a new analytics report</div>
              </button>
              <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="font-medium text-sm">Invite Users</div>
                <div className="text-xs text-muted-foreground">Add new team members</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}