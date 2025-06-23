
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NotificationTab } from "./NotificationTab";
import { Notification } from "@/hooks/useNotifications";
import {
  Bell,
  Heart,
  MessageSquare,
  User,
  Users,
} from "lucide-react";

interface NotificationTabsProps {
  notifications: Notification[];
  unreadCounts: {
    all: number;
    mentions: number;
    comments: number;
    likes: number;
    content: number;
    system: number;
    follow: number;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationTabs: React.FC<NotificationTabsProps> = ({
  notifications,
  unreadCounts,
  onMarkAsRead,
  onDelete,
}) => {
  return (
    <Tabs defaultValue="all" className="mb-8">
      <TabsList className="bg-gray-900 border-gray-800">
        <TabsTrigger value="all" className="data-[state=active]:bg-purple-900/30 relative">
          All
          {unreadCounts.all > 0 && (
            <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCounts.all}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="follows" className="data-[state=active]:bg-purple-900/30 relative">
          Follows
          {unreadCounts.follow > 0 && (
            <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCounts.follow}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="mentions" className="data-[state=active]:bg-purple-900/30 relative">
          Mentions
          {unreadCounts.mentions > 0 && (
            <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCounts.mentions}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="comments" className="data-[state=active]:bg-purple-900/30 relative">
          Comments
          {unreadCounts.comments > 0 && (
            <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCounts.comments}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="likes" className="data-[state=active]:bg-purple-900/30 relative">
          Likes
          {unreadCounts.likes > 0 && (
            <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCounts.likes}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="system" className="data-[state=active]:bg-purple-900/30 relative">
          System
          {unreadCounts.system > 0 && (
            <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCounts.system}</Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-6 space-y-4">
        <NotificationTab
          title="Recent Notifications"
          notifications={notifications}
          emptyIcon={Bell}
          emptyMessage="No notifications yet"
          emptyDescription="All your notifications will appear here"
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="follows" className="mt-6 space-y-4">
        <NotificationTab
          title="Follow Notifications"
          notifications={notifications.filter((notification) => notification.type === "follow")}
          emptyIcon={Users}
          emptyMessage="No follow notifications yet"
          emptyDescription="When someone follows you, it will appear here"
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="mentions" className="mt-6 space-y-4">
        <NotificationTab
          title="Mentions"
          notifications={notifications.filter((notification) => notification.type === "mention")}
          emptyIcon={User}
          emptyMessage="No mentions yet"
          emptyDescription="When someone mentions you, it will appear here"
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="comments" className="mt-6 space-y-4">
        <NotificationTab
          title="Comments"
          notifications={notifications.filter((notification) => notification.type === "comment")}
          emptyIcon={MessageSquare}
          emptyMessage="No comment notifications"
          emptyDescription="When someone comments on your posts, it will appear here"
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="likes" className="mt-6 space-y-4">
        <NotificationTab
          title="Likes"
          notifications={notifications.filter((notification) => notification.type === "like")}
          emptyIcon={Heart}
          emptyMessage="No likes yet"
          emptyDescription="When someone likes your content, it will appear here"
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="system" className="mt-6 space-y-4">
        <NotificationTab
          title="System Notifications"
          notifications={notifications.filter((notification) => ["system", "subscription", "promotion"].includes(notification.type))}
          emptyIcon={Bell}
          emptyMessage="No system notifications"
          emptyDescription="System notifications about your account will appear here"
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      </TabsContent>
    </Tabs>
  );
};
