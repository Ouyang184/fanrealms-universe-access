
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
  Grid,
  FileText,
  Mail,
  Award,
  UserCheck,
  DollarSign,
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
  const isCreatorStudioRoute = location.pathname.startsWith('/creator-studio');
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Define regular navigation routes
  const navigationRoutes = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Rss, label: "Feed", path: "/feed" },
    { icon: Users, label: "Following", path: "/following" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: ShoppingBag, label: "Subscriptions", path: "/subscriptions" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Define creator studio routes
  const creatorStudioRoutes = [
    { icon: Grid, label: "Dashboard", path: "/creator-studio/dashboard" },
    { icon: FileText, label: "Posts", path: "/creator-studio/posts" },
    { icon: Mail, label: "Messages", path: "/creator-studio/messages" },
    { icon: Award, label: "Membership Tiers", path: "/creator-studio/membership-tiers" },
    { icon: UserCheck, label: "Subscribers", path: "/creator-studio/subscribers" },
    { icon: DollarSign, label: "Payouts", path: "/creator-studio/payouts" },
    { icon: Settings, label: "Creator Settings", path: "/creator-studio/settings" },
  ];

  // Choose which routes to display based on current path
  const routesToDisplay = isCreatorStudioRoute ? creatorStudioRoutes : navigationRoutes;

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
              {routesToDisplay.map((route) => (
                <SidebarMenuItem key={route.path}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(route.path)}
                    tooltip={isCollapsed ? route.label : undefined}
                  >
                    <Link 
                      to={route.path} 
                      className={cn(
                        "w-full font-medium py-2.5",
                        isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                        isActive(route.path) && "bg-primary/30",
                      )}
                    >
                      <route.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{route.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>

          {/* Only show the Creator Studio link in the main navigation */}
          {!isCreatorStudioRoute && (
            <>
              <SidebarSeparator className="my-3" />
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
            </>
          )}

          {/* Show "Back to Home" in Creator Studio */}
          {isCreatorStudioRoute && (
            <>
              <SidebarSeparator className="my-3" />
              <div className="p-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild
                      tooltip={isCollapsed ? "Back to Home" : undefined}
                    >
                      <Link 
                        to="/" 
                        className={cn(
                          "w-full font-medium py-2.5",
                          isCollapsed ? "px-2 justify-center" : "px-4 gap-3"
                        )}
                      >
                        <Home className="h-5 w-5" />
                        {!isCollapsed && <span>Back to Home</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            </>
          )}
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
