
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";
import { HeaderNotifications } from "./Header/HeaderNotifications";
import { UserDropdownMenu } from "./Header/UserDropdownMenu";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
          <HeaderNotifications />
          
          {user ? (
            <>
              <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
                <Link to="/create">Create</Link>
              </Button>
              <UserDropdownMenu />
            </>
          ) : (
            <Button asChild variant="default">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
