
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Heart,
  MessageSquare,
  FileText,
  Star,
  MoreHorizontal,
  Check,
  Clock,
  User,
  Users,
  Gift,
  TestTube,
} from "lucide-react"
import { EmptyNotifications } from "@/components/notifications/EmptyNotifications"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { useAuth } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/LoadingSpinner"
import { useNotifications, Notification } from "@/hooks/useNotifications"
import { useTestNotifications } from "@/hooks/useTestNotifications"
import { formatDistanceToNow } from "date-fns"

export default function Notifications() {
  const { user } = useAuth();
  const { subscriptions, loadingSubscriptions } = useSubscriptions();
  const { createTestNotifications } = useTestNotifications();
  const { 
    notifications, 
    isLoading: loadingNotifications, 
    unreadCounts, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  // If still loading notifications, show loading state
  if (loadingNotifications) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }
  
  // Check if user has notifications
  const hasNotifications = notifications && notifications.length > 0;

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <User className="h-4 w-4 text-blue-400" />
      case "like":
        return <Heart className="h-4 w-4 text-red-400" />
      case "comment":
        return <MessageSquare className="h-4 w-4 text-green-400" />
      case "content":
        return <FileText className="h-4 w-4 text-purple-400" />
      case "subscription":
        return <Star className="h-4 w-4 text-yellow-400" />
      case "system":
        return <Bell className="h-4 w-4 text-orange-400" />
      case "follow":
        return <Users className="h-4 w-4 text-cyan-400" />
      case "promotion":
        return <Gift className="h-4 w-4 text-pink-400" />
      default:
        return <Bell className="h-4 w-4 text-gray-400" />
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const renderNotification = (notification: Notification) => (
    <div
      key={notification.id}
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
                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem 
                    className="text-red-400"
                    onClick={() => deleteNotification(notification.id)}
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

  // If user has no notifications, show the empty notifications state
  if (!hasNotifications) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => createTestNotifications()}
          >
            <TestTube className="h-4 w-4" />
            Create Test Notifications
          </Button>
        </div>
        <EmptyNotifications />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => createTestNotifications()}
          >
            <TestTube className="h-4 w-4" />
            Test
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => markAllAsRead()}
            disabled={unreadCounts.all === 0}
          >
            <Check className="h-4 w-4" />
            Mark All as Read
          </Button>
        </div>
      </div>

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
          <TabsTrigger value="system" className="data-[state=active]:bg-purple-900/30 relative">
            System
            {unreadCounts.system > 0 && (
              <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCounts.system}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">All Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {notifications.map(renderNotification)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follows" className="mt-6 space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Follow Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {notifications
                .filter((notification) => notification.type === "follow")
                .map(renderNotification)}
              {notifications.filter((notification) => notification.type === "follow").length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No follow notifications yet</p>
                  <p className="text-sm mt-1">When someone follows you, it will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentions" className="mt-6 space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mentions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {notifications
                .filter((notification) => notification.type === "mention")
                .map(renderNotification)}
              {notifications.filter((notification) => notification.type === "mention").length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No mentions yet</p>
                  <p className="text-sm mt-1">When someone mentions you, it will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6 space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">System Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {notifications
                .filter((notification) => ["system", "subscription", "promotion"].includes(notification.type))
                .map(renderNotification)}
              {notifications.filter((notification) =>
                ["system", "subscription", "promotion"].includes(notification.type),
              ).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No system notifications</p>
                  <p className="text-sm mt-1">System notifications about your account will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
