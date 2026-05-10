import { LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedAvatar } from "@/hooks/useUnifiedAvatar";

const menuItemClass = cn(
  "flex items-center gap-2 p-2 rounded-md text-sm",
  "hover:bg-accent transition-colors duration-200"
);

export function UserDropdownMenu() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getAvatarUrl } = useUnifiedAvatar();

  if (!user) return null;

  const initials = profile?.username
    ? profile.username.substring(0, 2).toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || "U";

  const email = profile?.email || user.email || "";
  const displayName = profile?.username || email.split('@')[0];

  const handleSignOut = async () => {
    try {
      // AuthContext.signOut() clears session, purges storage, waits for the
      // SIGNED_OUT event (cross-tab), and redirects to /login. Don't
      // double-toast or override the redirect here.
      await signOut();
    } catch (error: any) {
      toast({
        title: "Failed to log out",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="focus:outline-none">
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={getAvatarUrl(profile) || ""} alt={displayName} />
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

        {/* User shortcuts */}
        <div className="p-1">
          <Link to="/library" className={menuItemClass}>
            <span>My Library</span>
          </Link>
          <Link to="/dashboard" className={menuItemClass}>
            <span>Dashboard</span>
          </Link>
          <Link to="/dashboard/assets" className={menuItemClass}>
            <span>My Assets</span>
          </Link>
          <Link to="/dashboard/sales" className={menuItemClass}>
            <span>Sales</span>
          </Link>
        </div>
        <Separator />

        {/* Account */}
        <div className="p-1">
          {profile?.username && (
            <Link to={`/${profile.username}`} className={menuItemClass}>
              <span>View my profile</span>
            </Link>
          )}
          <Link to="/settings" className={menuItemClass}>
            <span>Settings</span>
          </Link>
          <Link to="/help" className={menuItemClass}>
            <span>Help & Support</span>
          </Link>
        </div>
        <Separator />

        <div className="p-1">
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-md text-sm",
              "hover:bg-accent text-destructive transition-colors duration-200"
            )}
          >
            <span>Logout</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
