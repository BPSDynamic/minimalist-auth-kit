import { 
  FolderOpen, 
  User, 
  Settings, 
  Upload, 
  Trash2,
  Share2,
  HardDrive,
  BarChart3
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
  { title: "Shared", url: "/dashboard/shared", icon: Share2 },
  { title: "Folders", url: "/dashboard/folders", icon: FolderOpen },
  { title: "Trash", url: "/dashboard/trash", icon: Trash2 },
];

const settingsItems = [
  { title: "Storage", url: "/dashboard/storage", icon: HardDrive },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const enterpriseItems = [
  { title: "Enterprise", url: "/dashboard/enterprise", icon: BarChart3 },
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
    // Use exact match for specific paths to avoid conflicts
    if (path === "/dashboard/share") {
      return currentPath === "/dashboard/share";
    }
    if (path === "/dashboard/shared") {
      return currentPath === "/dashboard/shared";
    }
    if (path === "/dashboard/folders") {
      return currentPath === "/dashboard/folders";
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
    <Sidebar className="border-r border-border" role="navigation" aria-label="Main navigation">
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

        <SidebarGroup>
          <SidebarGroupLabel>Enterprise</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {enterpriseItems.map((item) => (
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