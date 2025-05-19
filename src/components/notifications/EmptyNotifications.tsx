
import React from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export const EmptyNotifications: React.FC = () => {
  return (
    <div className="text-center py-16">
      <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-2xl font-semibold mb-2">No notifications yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        You don't have any notifications at the moment. Notifications will appear here when creators you follow post new content, mention you, or when there are updates about your account.
      </p>
      <Button asChild>
        <Link to="/explore">Discover Creators</Link>
      </Button>
    </div>
  );
};
