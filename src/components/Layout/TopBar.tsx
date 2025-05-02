
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactNode } from "react";

interface TopBarProps {
  children?: ReactNode;
}

export function TopBar({ children }: TopBarProps) {
  const { user } = useAuth();
  
  return (
    <div className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4">
        <div className="ml-auto flex items-center gap-4">
          {children}
          {user && (
            <Avatar>
              <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || "User"} />
              <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}

function getUserInitials(user: any): string {
  if (!user) return "";
  
  if (user.full_name) {
    return user.full_name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return "U";
}
