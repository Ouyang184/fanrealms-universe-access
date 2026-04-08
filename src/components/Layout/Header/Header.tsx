
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { HeaderNotifications } from "./HeaderNotifications";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="border-b border-border bg-background z-10 flex-shrink-0">
      <div className="flex items-center justify-between p-3">
        <div className="flex-1 max-w-md">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 ml-3">
          <HeaderNotifications />
          {user ? (
            <UserDropdownMenu />
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
