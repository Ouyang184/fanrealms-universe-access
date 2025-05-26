
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationItem } from "./NotificationItem";
import { Notification } from "@/hooks/useNotifications";
import { LucideIcon } from "lucide-react";

interface NotificationTabProps {
  title: string;
  notifications: Notification[];
  emptyIcon: LucideIcon;
  emptyMessage: string;
  emptyDescription: string;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationTab: React.FC<NotificationTabProps> = ({
  title,
  notifications,
  emptyIcon: EmptyIcon,
  emptyMessage,
  emptyDescription,
  onMarkAsRead,
  onDelete,
}) => {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <EmptyIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{emptyMessage}</p>
            <p className="text-sm mt-1">{emptyDescription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
