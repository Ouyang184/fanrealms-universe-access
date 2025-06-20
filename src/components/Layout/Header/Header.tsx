
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { HeaderNotifications } from "./HeaderNotifications";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Rss } from "lucide-react";

export function Header() {
  const { user } = useAuth();
  
  return (
    <header className="border-b border-border bg-background z-10">
      <div className="flex items-center justify-between p-4">
        <SearchBar />

        {/* Top Right Icons */}
        <div className="flex items-center gap-4 ml-4">
          <HeaderNotifications />
          
          {user && (
            <>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
                <Link to="/feed">
                  <Rss className="h-5 w-5" />
                  <span className="sr-only">Feed</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
                </Link>
              </Button>
            </>
          )}
          
          {user ? (
            <UserDropdownMenu />
          ) : (
            <Button asChild variant="default">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
