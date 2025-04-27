
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';

export function TopBar() {
  const { user, profile } = useAuth();
  
  const userInitial = profile?.username?.charAt(0) || user?.email?.charAt(0) || 'U';
  
  return (
    <header className="border-b h-14 flex items-center px-4 bg-background/60 backdrop-blur-md sticky top-0 z-10">
      <div className="flex-1 flex items-center gap-4">
        <SearchBar />
      </div>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
