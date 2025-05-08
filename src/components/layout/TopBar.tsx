
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactNode } from "react";

interface TopBarProps {
  children?: ReactNode;
}

export function TopBar({ children }: TopBarProps) {
  const { user, profile } = useAuth();
  
  return (
    <div className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4">
        <div className="ml-auto flex items-center gap-4">
          {children}
          {user && (
            <Avatar>
              <AvatarImage src={profile?.profile_picture || ""} alt={profile?.username || "User"} />
              <AvatarFallback>{getUserInitials(user, profile)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}

function getUserInitials(user: any, profile?: any): string {
  if (!user) return "";
  
  // Try to get initials from profile username first
  if (profile?.username) {
    return profile.username
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  
  // Fallback to email from user object
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return "U";
}
