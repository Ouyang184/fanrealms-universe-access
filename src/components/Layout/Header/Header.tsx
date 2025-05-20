
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
  const isCreatorStudioPage = location.pathname.includes('/creator-studio');
  
  const createButtonLink = isCreatorStudioPage ? "/creator-studio/posts" : "/creator-studio/dashboard";
  const createButtonText = isCreatorStudioPage ? "Create Post" : "Create";
  
  return (
    <header className="border-b border-border bg-background z-10">
      <div className="flex items-center justify-between p-4">
        <SearchBar />

        {/* Top Right Icons */}
        <div className="flex items-center gap-4 ml-4">
          <HeaderNotifications />
          <Link to={createButtonLink}>
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              {createButtonText}
            </Button>
          </Link>
          <UserMenu profile={profile} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}
