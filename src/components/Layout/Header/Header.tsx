
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { HeaderNotifications } from "./HeaderNotifications";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user } = useAuth();
  
  return (
    <header className="border-b border-border bg-background z-10">
      <div className="flex items-center justify-between p-4">
        <SearchBar />

        {/* Top Right Icons */}
        <div className="flex items-center gap-4 ml-4">
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
    </header>
  );
}
