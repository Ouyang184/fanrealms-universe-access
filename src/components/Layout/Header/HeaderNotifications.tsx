
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";

export function HeaderNotifications() {
  const { unreadCounts } = useNotifications();
  const { isCreator } = useCreatorProfile();

  // Only show the bell for creators — no message icon until DMs are built
  if (!isCreator) return null;

  return (
    <Link to="/dashboard">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCounts.all > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCounts.all > 9 ? '9+' : unreadCounts.all}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>
    </Link>
  );
}
