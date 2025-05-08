
import { Search, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { signOut, profile } = useAuth();
  
  return (
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
  );
}
