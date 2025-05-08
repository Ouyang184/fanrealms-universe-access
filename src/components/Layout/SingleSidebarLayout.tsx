
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  Mail,
  Award,
  UserCheck,
  Banknote,
  MonitorSmartphone,
  Home,
  Compass,
  User,
  HelpCircle,
  Users,
  Rss,
  Store,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";

interface SingleSidebarLayoutProps {
  children: React.ReactNode
}

export function SingleSidebarLayout({ children }: SingleSidebarLayoutProps) {
  const [creatorStudioOpen, setCreatorStudioOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Search Bar and User Actions */}
        <header className="border-b border-border/30 bg-transparent z-10">
          <div className="flex items-center justify-between p-4">
            {/* Logo */}
            <div className="flex items-center">
              <Logo collapsed={false} />
            </div>
            
            <div className="relative flex-1 max-w-xl mx-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for creators, posts, or content..."
                className="pl-10 bg-zinc-900 border-zinc-700"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-zinc-800 rounded-md">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-zinc-800 rounded-md">K</kbd>
              </div>
            </div>

            {/* Top Right Icons */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
                <span className="sr-only">Notifications</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Messages</span>
              </Button>
              <Button variant="default" className="bg-purple-600 hover:bg-purple-700">
                Create
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={profile?.profile_picture || ""} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {profile?.username ? profile.username.substring(0, 2).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-1 bg-zinc-900 border-zinc-700" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.username || "User"}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email || ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuItem className="flex items-center gap-2 hover:bg-zinc-800">
                    <User className="h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 hover:bg-zinc-800">
                    <Settings className="h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 hover:bg-zinc-800">
                    <HelpCircle className="h-4 w-4" /> Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuItem className="flex items-center gap-2 text-red-400 hover:bg-zinc-800" onClick={signOut}>
                    <LogOut className="h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area with Sidebar on the right */}
        <div className="flex flex-1 overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
          
          {/* Right Sidebar */}
          <div className="w-64 border-l border-zinc-800 bg-black overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-1">
                <Link to="/home" className="block">
                  <Button
                    variant={isActive("/home") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      isActive("/home") && "bg-primary/30",
                    )}
                  >
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </Button>
                </Link>
                <Link to="/feed" className="block">
                  <Button
                    variant={isActive("/feed") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      isActive("/feed") && "bg-primary/30",
                    )}
                  >
                    <Rss className="h-5 w-5" />
                    <span>Feed</span>
                  </Button>
                </Link>
                <Link to="/following" className="block">
                  <Button
                    variant={isActive("/following") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      isActive("/following") && "bg-primary/30",
                    )}
                  >
                    <Users className="h-5 w-5" />
                    <span>Following</span>
                  </Button>
                </Link>
                <Link to="/explore" className="block">
                  <Button
                    variant={isActive("/explore") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      isActive("/explore") && "bg-primary/30",
                    )}
                  >
                    <Compass className="h-5 w-5" />
                    <span>Explore</span>
                  </Button>
                </Link>
                <Link to="/messages" className="block">
                  <Button
                    variant={isActive("/messages") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      isActive("/messages") && "bg-primary/30",
                    )}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Messages</span>
                  </Button>
                </Link>
                <Link to="/notifications" className="block">
                  <Button
                    variant={isActive("/notifications") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      isActive("/notifications") && "bg-primary/30",
                    )}
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </Button>
                </Link>
                <Link to="/subscriptions" className="block">
                  <Button
                    variant={isActive("/subscriptions") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      isActive("/subscriptions") && "bg-primary/30",
                    )}
                  >
                    <Store className="h-5 w-5" />
                    <span>Subscriptions</span>
                  </Button>
                </Link>
                <Link to="/settings" className="block">
                  <Button
                    variant={isActive("/settings") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      isActive("/settings") && "bg-primary/30",
                    )}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Account Settings</span>
                  </Button>
                </Link>
              </div>

              <Separator className="my-4 bg-zinc-800" />

              {/* Creator Studio Section */}
              <div className="px-4">
                <Collapsible 
                  open={creatorStudioOpen} 
                  onOpenChange={setCreatorStudioOpen}
                  className="w-full"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-2 font-semibold text-lg">
                    <span>Creator Studio</span>
                    <ChevronDown className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200",
                      creatorStudioOpen && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-2">
                    <Link to="/creator-studio/dashboard" className="block">
                      <Button
                        variant={isActive("/creator-studio/dashboard") ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 font-medium",
                          isActive("/creator-studio/dashboard") && "bg-primary/30",
                        )}
                      >
                        <LayoutDashboard className="h-5 w-5" />
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
                        <Banknote className="h-5 w-5" />
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
                        <MonitorSmartphone className="h-5 w-5" />
                        Creator Settings
                      </Button>
                    </Link>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
            
            {/* Sidebar Footer */}
            <div className="border-t border-zinc-800 p-4">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground justify-start gap-3"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
