
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TopBar() {
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };
  
  const userInitial = profile?.username?.charAt(0) || user?.email?.charAt(0) || 'U';
  
  return (
    <header className="border-b h-14 px-4 flex items-center justify-between bg-background/60 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full" size="icon">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.profile_picture || undefined} alt={profile?.username || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {profile?.username && (
                  <p className="font-medium">{profile.username}</p>
                )}
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer flex w-full items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer flex w-full items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
