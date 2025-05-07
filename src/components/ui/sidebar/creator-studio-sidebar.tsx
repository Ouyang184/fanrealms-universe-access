
import { useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { 
  Grid,
  FileText,
  Mail,
  Award,
  UserCheck,
  DollarSign,
  Settings,
  LogOut,
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

export function CreatorStudioSidebar() {
  const location = useLocation();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  
  const isCollapsed = sidebarState === "collapsed";
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
              {creatorStudioRoutes.map((route) => (
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
