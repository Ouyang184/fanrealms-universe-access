
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { HeaderNotifications } from "./HeaderNotifications";
import { UserMenu } from "./UserMenu";
import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  profile: any;
  onSignOut: () => void;
}

export function Header({ profile, onSignOut }: HeaderProps) {
  const location = useLocation();
  
  // Determine if we're in creator studio to handle the create button properly
  const isCreatorStudio = location.pathname.includes('/creator-studio');
  
  return (
    <header className="border-b border-border bg-background z-10">
      <div className="flex items-center justify-between p-4">
        <SearchBar />

        {/* Top Right Icons */}
        <div className="flex items-center gap-4 ml-4">
          <HeaderNotifications />
          {isCreatorStudio ? (
            <Link to="/creator-studio/posts/create">
              <Button variant="default" className="bg-primary hover:bg-primary/90">
                Create Post
              </Button>
            </Link>
          ) : (
            <Link to="/creator-studio/dashboard">
              <Button variant="default" className="bg-primary hover:bg-primary/90">
                Create
              </Button>
            </Link>
          )}
          <UserMenu profile={profile} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}
