
import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  onMarkAllAsRead,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">Notifications</h1>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <Check className="h-4 w-4" />
          Mark All as Read
        </Button>
      </div>
    </div>
  );
};
