
import { useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Compass,
  MessageSquare,
  Bell,
  ShoppingBag,
  Settings,
  LogOut,
  Rss,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const location = useLocation();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  
  const isCollapsed = sidebarState === "collapsed";
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <SidebarHeader>
        <div className={cn(
          "flex items-center p-4 transition-all duration-300",
          isCollapsed ? "justify-center w-full" : "justify-between w-full"
        )}>
          <Logo collapsed={isCollapsed} onClick={toggleSidebar} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
          <div className="space-y-1 p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive("/")}
                  tooltip={isCollapsed ? "Home" : undefined}
                >
                  <Link 
                    to="/" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/") && "bg-primary/30",
                    )}
                  >
                    <Home className="h-5 w-5" />
                    {!isCollapsed && <span>Home</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive("/feed")}
                  tooltip={isCollapsed ? "Feed" : undefined}
                >
                  <Link 
                    to="/feed" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/feed") && "bg-primary/30",
                    )}
                  >
                    <Rss className="h-5 w-5" />
                    {!isCollapsed && <span>Feed</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive("/following")}
                  tooltip={isCollapsed ? "Following" : undefined}
                >
                  <Link 
                    to="/following" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/following") && "bg-primary/30",
                    )}
                  >
                    <Users className="h-5 w-5" />
                    {!isCollapsed && <span>Following</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive("/explore")}
                  tooltip={isCollapsed ? "Explore" : undefined}
                >
                  <Link 
                    to="/explore" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/explore") && "bg-primary/30",
                    )}
                  >
                    <Compass className="h-5 w-5" />
                    {!isCollapsed && <span>Explore</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive("/messages")}
                  tooltip={isCollapsed ? "Messages" : undefined}
                >
                  <Link 
                    to="/messages" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/messages") && "bg-primary/30",
                    )}
                  >
                    <MessageSquare className="h-5 w-5" />
                    {!isCollapsed && <span>Messages</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive("/notifications")}
                  tooltip={isCollapsed ? "Notifications" : undefined}
                >
                  <Link 
                    to="/notifications" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/notifications") && "bg-primary/30",
                    )}
                  >
                    <Bell className="h-5 w-5" />
                    {!isCollapsed && <span>Notifications</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive("/subscriptions")}
                  tooltip={isCollapsed ? "Subscriptions" : undefined}
                >
                  <Link 
                    to="/subscriptions" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/subscriptions") && "bg-primary/30",
                    )}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {!isCollapsed && <span>Subscriptions</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive("/settings")}
                  tooltip={isCollapsed ? "Settings" : undefined}
                >
                  <Link 
                    to="/settings" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/settings") && "bg-primary/30",
                    )}
                  >
                    <Settings className="h-5 w-5" />
                    {!isCollapsed && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          <SidebarSeparator className="my-3" />

          {/* Add a link to Creator Studio */}
          <div className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  tooltip={isCollapsed ? "Creator Studio" : undefined}
                >
                  <Link 
                    to="/creator-studio/dashboard" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3"
                    )}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {!isCollapsed && <span>Creator Studio</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter>
        <div className={cn("border-t border-border", isCollapsed ? "p-2" : "p-4")}>
          <Button
            variant="ghost"
            className={cn("w-full text-muted-foreground", isCollapsed ? "justify-center px-2" : "justify-start gap-3")}
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

// Export the SeparatorSidebar for use by the AppSidebar
function SidebarSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return (
    <Separator 
      className={cn("my-4", className)} 
      {...props}
    />
  );
}
