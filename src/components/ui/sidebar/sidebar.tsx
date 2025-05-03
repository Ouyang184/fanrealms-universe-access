
import { useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Compass,
  MessageSquare,
  Bell,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  Grid,
  FileText,
  Mail,
  Award,
  UserCheck,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Logo } from "@/components/logo";
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
                  isActive={isActive("/favorites")}
                  tooltip={isCollapsed ? "Favorites" : undefined}
                >
                  <Link 
                    to="/favorites" 
                    className={cn(
                      "w-full font-medium py-2.5",
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                      isActive("/favorites") && "bg-primary/30",
                    )}
                  >
                    <Heart className="h-5 w-5" />
                    {!isCollapsed && <span>Favorites</span>}
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

          {isCollapsed ? (
            <div className="p-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Dashboard">
                    <Grid className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Posts">
                    <FileText className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Creator Messages">
                    <Mail className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Membership Tiers">
                    <Award className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Subscribers">
                    <UserCheck className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Payouts">
                    <DollarSign className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          ) : (
            <div className="px-2">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 font-semibold text-lg">
                  <div className="flex items-center gap-2">
                    <span>Creator Studio</span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 space-y-1">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive("/creator-studio/dashboard")}
                      >
                        <Link 
                          to="/creator-studio/dashboard" 
                          className={cn(
                            "w-full justify-start gap-3 font-medium",
                            isActive("/creator-studio/dashboard") && "bg-primary/30",
                          )}
                        >
                          <Grid className="h-5 w-5" />
                          Dashboard
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive("/creator-studio/posts")}
                      >
                        <Link 
                          to="/creator-studio/posts" 
                          className={cn(
                            "w-full justify-start gap-3 font-medium",
                            isActive("/creator-studio/posts") && "bg-primary/30",
                          )}
                        >
                          <FileText className="h-5 w-5" />
                          Posts
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive("/creator-studio/messages")}
                      >
                        <Link 
                          to="/creator-studio/messages" 
                          className={cn(
                            "w-full justify-start gap-3 font-medium",
                            isActive("/creator-studio/messages") && "bg-primary/30",
                          )}
                        >
                          <Mail className="h-5 w-5" />
                          Messages
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive("/creator-studio/membership-tiers")}
                      >
                        <Link 
                          to="/creator-studio/membership-tiers" 
                          className={cn(
                            "w-full justify-start gap-3 font-medium",
                            isActive("/creator-studio/membership-tiers") && "bg-primary/30",
                          )}
                        >
                          <Award className="h-5 w-5" />
                          Membership Tiers
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive("/creator-studio/subscribers")}
                      >
                        <Link 
                          to="/creator-studio/subscribers" 
                          className={cn(
                            "w-full justify-start gap-3 font-medium",
                            isActive("/creator-studio/subscribers") && "bg-primary/30",
                          )}
                        >
                          <UserCheck className="h-5 w-5" />
                          Subscribers
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive("/creator-studio/payouts")}
                      >
                        <Link 
                          to="/creator-studio/payouts" 
                          className={cn(
                            "w-full justify-start gap-3 font-medium",
                            isActive("/creator-studio/payouts") && "bg-primary/30",
                          )}
                        >
                          <DollarSign className="h-5 w-5" />
                          Payouts
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive("/creator-studio/settings")}
                      >
                        <Link 
                          to="/creator-studio/settings" 
                          className={cn(
                            "w-full justify-start gap-3 font-medium",
                            isActive("/creator-studio/settings") && "bg-primary/30",
                          )}
                        >
                          <Settings className="h-5 w-5" />
                          Creator Settings
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </div>
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
