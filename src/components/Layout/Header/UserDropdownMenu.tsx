
import { Settings, User, HelpCircle, LogOut, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function UserDropdownMenu() {
  const { user, profile, signOut } = useAuth();
  
  // Check if the user is a creator
  const { data: creatorProfile } = useQuery({
    queryKey: ['userCreator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking creator status:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });
  
  const isCreator = !!creatorProfile;
  
  if (!user) return null;
  
  const initials = profile?.username 
    ? profile.username.substring(0, 2).toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || "U";
  
  const email = profile?.email || user.email || "";
  const displayName = profile?.username || email.split('@')[0];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="focus:outline-none">
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={profile?.profile_picture || ""} alt={displayName} />
            <AvatarFallback className="bg-primary/80 text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3">
          <div className="text-base font-medium">{displayName}</div>
          <div className="text-sm text-muted-foreground">{email}</div>
        </div>
        <Separator />
        <div className="p-1">
          <Link to="/profile" className={cn(
            "flex items-center gap-2 p-2 rounded-md text-sm",
            "hover:bg-accent transition-colors duration-200"
          )}>
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
          
          {isCreator && (
            <Link to="/creator-studio/settings" className={cn(
              "flex items-center gap-2 p-2 rounded-md text-sm",
              "hover:bg-accent transition-colors duration-200"
            )}>
              <Palette className="h-4 w-4" />
              <span>Creator Profile</span>
            </Link>
          )}
          
          <Link to="/settings" className={cn(
            "flex items-center gap-2 p-2 rounded-md text-sm",
            "hover:bg-accent transition-colors duration-200"
          )}>
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <Link to="/help" className={cn(
            "flex items-center gap-2 p-2 rounded-md text-sm",
            "hover:bg-accent transition-colors duration-200"
          )}>
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </Link>
        </div>
        <Separator />
        <div className="p-1">
          <button 
            onClick={signOut}
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-md text-sm",
              "hover:bg-accent text-destructive transition-colors duration-200"
            )}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
