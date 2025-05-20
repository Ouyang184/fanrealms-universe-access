
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { HeaderNotifications } from "./HeaderNotifications";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  profile: any;
  onSignOut: () => void;
}

export function Header({ profile, onSignOut }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background z-10">
      <div className="flex items-center justify-between p-4">
        <SearchBar />

        {/* Top Right Icons */}
        <div className="flex items-center gap-4 ml-4">
          <HeaderNotifications />
          <Button variant="default" className="bg-primary hover:bg-primary/90">
            Create
          </Button>
          <UserMenu profile={profile} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}
