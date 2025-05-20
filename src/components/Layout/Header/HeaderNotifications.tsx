
import { Link } from "react-router-dom";
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderNotificationsProps {
  unreadNotifications: number;
  unreadMessages: number;
}

export function HeaderNotifications({ unreadNotifications, unreadMessages }: HeaderNotificationsProps) {
  return (
    <>
      <Link to="/notifications">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </Link>
      <Link to="/messages">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <MessageSquare className="h-5 w-5" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
          <span className="sr-only">Messages</span>
        </Button>
      </Link>
    </>
  );
}
