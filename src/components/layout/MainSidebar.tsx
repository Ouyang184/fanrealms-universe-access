
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  Home, 
  Compass, 
  Users, 
  MessageSquare, 
  Bell, 
  ShoppingBag, 
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { CreatorStudioSection } from "./sidebar/CreatorStudioSection";

interface MainSidebarProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export function MainSidebar({ sidebarCollapsed, toggleSidebar }: MainSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div
      className={cn(
        "border-r border-border flex flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-72",
      )}
    >
      {/* Logo */}
      <div className={cn("p-4 flex items-center", sidebarCollapsed ? "justify-center" : "justify-start")}>
        <Logo collapsed={sidebarCollapsed} onClick={toggleSidebar} />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          <Link to="/" className="block">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              className={cn(
                "w-full font-medium",
                sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                isActive("/") && "bg-primary/30",
              )}
            >
              <Home className="h-5 w-5" />
              {!sidebarCollapsed && <span>Home</span>}
            </Button>
          </Link>
          <Link to="/feed" className="block">
            <Button
              variant={isActive("/feed") ? "secondary" : "ghost"}
              className={cn(
                "w-full font-medium",
                sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                isActive("/feed") && "bg-primary/30",
              )}
            >
              <Users className="h-5 w-5" />
              {!sidebarCollapsed && <span>Feed</span>}
            </Button>
          </Link>
          <Link to="/following" className="block">
            <Button
              variant={isActive("/following") ? "secondary" : "ghost"}
              className={cn(
                "w-full font-medium",
                sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                isActive("/following") && "bg-primary/30",
              )}
            >
              <Users className="h-5 w-5" />
              {!sidebarCollapsed && <span>Following</span>}
            </Button>
          </Link>
          <Link to="/explore" className="block">
            <Button
              variant={isActive("/explore") ? "secondary" : "ghost"}
              className={cn(
                "w-full font-medium",
                sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                isActive("/explore") && "bg-primary/30",
              )}
            >
              <Compass className="h-5 w-5" />
              {!sidebarCollapsed && <span>Explore</span>}
            </Button>
          </Link>
          <Link to="/messages" className="block">
            <Button
              variant={isActive("/messages") ? "secondary" : "ghost"}
              className={cn(
                "w-full font-medium",
                sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                isActive("/messages") && "bg-primary/30",
              )}
            >
              <MessageSquare className="h-5 w-5" />
              {!sidebarCollapsed && <span>Messages</span>}
            </Button>
          </Link>
          <Link to="/notifications" className="block">
            <Button
              variant={isActive("/notifications") ? "secondary" : "ghost"}
              className={cn(
                "w-full font-medium",
                sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                isActive("/notifications") && "bg-primary/30",
              )}
            >
              <Bell className="h-5 w-5" />
              {!sidebarCollapsed && <span>Notifications</span>}
            </Button>
          </Link>
          <Link to="/subscriptions" className="block">
            <Button
              variant={isActive("/subscriptions") ? "secondary" : "ghost"}
              className={cn(
                "w-full font-medium",
                sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                isActive("/subscriptions") && "bg-primary/30",
              )}
            >
              <ShoppingBag className="h-5 w-5" />
              {!sidebarCollapsed && <span>Subscriptions</span>}
            </Button>
          </Link>
          <Link to="/settings" className="block">
            <Button
              variant={isActive("/settings") ? "secondary" : "ghost"}
              className={cn(
                "w-full font-medium",
                sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                isActive("/settings") && "bg-primary/30",
              )}
            >
              <Settings className="h-5 w-5" />
              {!sidebarCollapsed && <span>Account Settings</span>}
            </Button>
          </Link>
        </div>

        <Separator className="my-4" />
        
        <CreatorStudioSection sidebarCollapsed={sidebarCollapsed} isActive={isActive} />
      </ScrollArea>

      <div className={cn("border-t border-border", sidebarCollapsed ? "p-2" : "p-4")}>
        <Button
          variant="ghost"
          className={cn("w-full text-muted-foreground", sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3")}
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {!sidebarCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
