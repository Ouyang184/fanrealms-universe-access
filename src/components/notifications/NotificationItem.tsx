
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Heart,
  MessageSquare,
  Star,
  MoreHorizontal,
  Clock,
  User,
  Users,
  Gift,
  Briefcase,
} from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <User className="h-4 w-4 text-blue-400" />
      case "like":
        return <Heart className="h-4 w-4 text-red-400" />
      case "comment":
        return <MessageSquare className="h-4 w-4 text-green-400" />
      case "subscription":
        return <Star className="h-4 w-4 text-yellow-400" />
      case "system":
        return <Bell className="h-4 w-4 text-orange-400" />
      case "follow":
        return <Users className="h-4 w-4 text-cyan-400" />
      case "promotion":
        return <Gift className="h-4 w-4 text-pink-400" />
      case "commission":
        return <Briefcase className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-400" />
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div
      className={`p-4 rounded-lg border ${
        notification.is_read ? "bg-gray-900 border-gray-800" : "bg-gray-800/50 border-gray-700"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              {notification.title && (
                <span className="font-medium">{notification.title} </span>
              )}
              <span className="text-gray-300">{notification.content}</span>
              {notification.metadata?.post_title && (
                <div className="block text-sm text-purple-400 hover:text-purple-300 mt-1">
                  {notification.metadata.post_title}
                </div>
              )}
              {notification.metadata?.tier_name && notification.metadata?.tier_price && (
                <div className="text-sm text-gray-400 mt-1">
                  {notification.metadata.tier_name} • ${notification.metadata.tier_price}/month
                </div>
              )}
            </div>
            <div className="flex items-center">
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                {formatTimestamp(notification.created_at)}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white" align="end">
                  {!notification.is_read && (
                    <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  {notification.is_read && (
                    <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                  )}
                  {notification.type === "mention" && (
                    <DropdownMenuItem>Turn off mentions from this user</DropdownMenuItem>
                  )}
                  {notification.type === "comment" && (
                    <>
                      <DropdownMenuItem>View comment</DropdownMenuItem>
                      <DropdownMenuItem>Reply</DropdownMenuItem>
                    </>
                  )}
                  {notification.type === "like" && (
                    <DropdownMenuItem>View post</DropdownMenuItem>
                  )}
                  {notification.type === "commission" && (
                    <DropdownMenuItem>View commission</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem 
                    className="text-red-400"
                    onClick={() => onDelete(notification.id)}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
