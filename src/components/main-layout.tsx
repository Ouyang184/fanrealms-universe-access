import { useState } from 'react';
import { 
  Search,
  Bell,
  MessageSquare,
  ShoppingBag,
  Settings,
  LogOut,
  Grid,
  FileText,
  Mail,
  Award,
  UserCheck,
  DollarSign,
  ChevronDown,
  Home,
  Compass,
  User,
  HelpCircle,
  Rss,
  Users,
} from "lucide-react";
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, profile, user } = useAuth();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Determine Home route based on auth state
  const homeRoute = user ? "/home" : "/";

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background text-foreground">
        {/* Sidebar */}
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
              <Link to={homeRoute} className="block">
                <Button
                  variant={isActive(homeRoute) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full font-medium",
                    sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3",
                    isActive(homeRoute) && "bg-primary/30",
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
                  <Rss className="h-5 w-5" />
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

            {sidebarCollapsed ? (
              <div className="p-2">
                <Button variant="ghost" className="w-full justify-center px-2">
                  <Grid className="h-5 w-5" />
                </Button>
                <Button variant="ghost" className="w-full justify-center px-2">
                  <FileText className="h-5 w-5" />
                </Button>
                <Button variant="ghost" className="w-full justify-center px-2">
                  <Mail className="h-5 w-5" />
                </Button>
                <Button variant="ghost" className="w-full justify-center px-2">
                  <Award className="h-5 w-5" />
                </Button>
                <Button variant="ghost" className="w-full justify-center px-2">
                  <UserCheck className="h-5 w-5" />
                </Button>
                <Button variant="ghost" className="w-full justify-center px-2">
                  <DollarSign className="h-5 w-5" />
                </Button>
                <Button variant="ghost" className="w-full justify-center px-2">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Collapsible defaultOpen className="px-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 font-semibold text-lg">
                  <div className="flex items-center gap-2">
                    <span>Creator Studio</span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 space-y-1">
                  <Link to="/creator-studio/dashboard" className="block">
                    <Button
                      variant={isActive("/creator-studio/dashboard") ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 font-medium",
                        isActive("/creator-studio/dashboard") && "bg-primary/30",
                      )}
                    >
                      <Grid className="h-5 w-5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/creator-studio/posts" className="block">
                    <Button
                      variant={isActive("/creator-studio/posts") ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 font-medium",
                        isActive("/creator-studio/posts") && "bg-primary/30",
                      )}
                    >
                      <FileText className="h-5 w-5" />
                      Posts
                    </Button>
                  </Link>
                  <Link to="/creator-studio/messages" className="block">
                    <Button
                      variant={isActive("/creator-studio/messages") ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 font-medium",
                        isActive("/creator-studio/messages") && "bg-primary/30",
                      )}
                    >
                      <Mail className="h-5 w-5" />
                      Messages
                    </Button>
                  </Link>
                  <Link to="/creator-studio/membership-tiers" className="block">
                    <Button
                      variant={isActive("/creator-studio/membership-tiers") ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 font-medium",
                        isActive("/creator-studio/membership-tiers") && "bg-primary/30",
                      )}
                    >
                      <Award className="h-5 w-5" />
                      Membership Tiers
                    </Button>
                  </Link>
                  <Link to="/creator-studio/subscribers" className="block">
                    <Button
                      variant={isActive("/creator-studio/subscribers") ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 font-medium",
                        isActive("/creator-studio/subscribers") && "bg-primary/30",
                      )}
                    >
                      <UserCheck className="h-5 w-5" />
                      Subscribers
                    </Button>
                  </Link>
                  <Link to="/creator-studio/payouts" className="block">
                    <Button
                      variant={isActive("/creator-studio/payouts") ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 font-medium",
                        isActive("/creator-studio/payouts") && "bg-primary/30",
                      )}
                    >
                      <DollarSign className="h-5 w-5" />
                      Payouts
                    </Button>
                  </Link>
                  <Link to="/creator-studio/settings" className="block">
                    <Button
                      variant={isActive("/creator-studio/settings") ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 font-medium",
                        isActive("/creator-studio/settings") && "bg-primary/30",
                      )}
                    >
                      <Settings className="h-5 w-5" />
                      Creator Settings
                    </Button>
                  </Link>
                </CollapsibleContent>
              </Collapsible>
            )}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Search Bar and User Actions */}
          <header className="border-b border-border bg-background z-10">
            <div className="flex items-center justify-between p-4">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search for creators, posts, or content..."
                  className="pl-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded-md">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded-md">K</kbd>
                </div>
              </div>

              {/* Top Right Icons */}
              <div className="flex items-center gap-4 ml-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                  <span className="sr-only">Notifications</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
                </Button>
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Create
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage src={profile?.profile_picture || ""} />
                      <AvatarFallback className="bg-primary/80 text-primary-foreground">
                        {profile?.username ? profile.username.substring(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mt-1" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.username || "User"}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email || ""}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" /> Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2 text-destructive" onClick={signOut}>
                      <LogOut className="h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
