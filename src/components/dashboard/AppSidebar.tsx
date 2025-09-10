import { 
  FolderOpen, 
  User, 
  Settings, 
  Upload, 
  Star,
  Trash2,
  Share2,
  HardDrive
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "My Files", url: "/dashboard", icon: FolderOpen },
  { title: "Share Files", url: "/dashboard/share", icon: Upload },
  { title: "Recent", url: "/dashboard/recent", icon: Upload },
  { title: "Starred", url: "/dashboard/starred", icon: Star },
  { title: "Shared", url: "/dashboard/shared", icon: Share2 },
  { title: "Trash", url: "/dashboard/trash", icon: Trash2 },
];

const settingsItems = [
  { title: "Storage", url: "/dashboard/storage", icon: HardDrive },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    const active = isActive(path);
    return active 
      ? "bg-primary text-primary-foreground hover:bg-primary-hover" 
      : "hover:bg-muted/50";
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-auth-gradient rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            {!collapsed && <span className="font-semibold text-lg">CloudVault</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={getNavClass(item.url)}>
                    <NavLink to={item.url} end={item.url === "/dashboard"}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={getNavClass(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}