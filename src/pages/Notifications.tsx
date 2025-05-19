import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DollarSign,
} from "lucide-react"
import { useState, useEffect } from "react"
import { EmptyNotifications } from "@/components/notifications/EmptyNotifications"

// Sample notification data
const notifications = [
  {
    id: 1,
    type: "mention",
    read: false,
    timestamp: "5 minutes ago",
    user: {
      name: "ArtistAlley",
      username: "artistalley",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: 'mentioned you in a comment: "@johndoe Thanks for your feedback on my latest tutorial!"',
    post: {
      title: "Character Design Masterclass Part 3",
      link: "/posts/character-design-3",
    },
  },
  {
    id: 2,
    type: "like",
    read: false,
    timestamp: "1 hour ago",
    user: {
      name: "GameDev Masters",
      username: "gamedevmasters",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "liked your comment on their post",
    post: {
      title: "Creating Advanced AI Behavior Trees",
      link: "/posts/ai-behavior-trees",
    },
  },
  {
    id: 3,
    type: "comment",
    read: true,
    timestamp: "3 hours ago",
    user: {
      name: "Music Production Hub",
      username: "musicprodhub",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: 'replied to your comment: "Great suggestion! I\'ll include that in my next sample pack."',
    post: {
      title: "May Sample Pack: Ambient Textures",
      link: "/posts/may-sample-pack",
    },
  },
  {
    id: 4,
    type: "content",
    read: false,
    timestamp: "Yesterday",
    user: {
      name: "ArtistAlley",
      username: "artistalley",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "posted new content for Pro Artist subscribers",
    post: {
      title: "Lighting Techniques for Digital Painting",
      link: "/posts/lighting-techniques",
    },
  },
  {
    id: 5,
    type: "subscription",
    read: true,
    timestamp: "2 days ago",
    user: {
      name: "Writing Workshop",
      username: "writingworkshop",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "Your subscription has been renewed successfully",
    tier: {
      name: "Author's Circle",
      price: "$20.00/month",
    },
  },
  {
    id: 6,
    type: "system",
    read: true,
    timestamp: "3 days ago",
    content: "Your payment method will expire soon. Please update your billing information.",
    action: "Update Payment",
    actionLink: "/account/billing",
  },
  {
    id: 7,
    type: "mention",
    read: true,
    timestamp: "4 days ago",
    user: {
      name: "Photo Masters",
      username: "photomasters",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: 'mentioned you in a post: "Special thanks to @johndoe for the inspiration!"',
    post: {
      title: "Portrait Photography Essentials",
      link: "/posts/portrait-photography",
    },
  },
  {
    id: 8,
    type: "content",
    read: true,
    timestamp: "5 days ago",
    user: {
      name: "GameDev Masters",
      username: "gamedevmasters",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "posted new content for Indie Developer subscribers",
    post: {
      title: "Game Asset Creation: Low Poly Characters",
      link: "/posts/low-poly-characters",
    },
  },
  {
    id: 9,
    type: "follow",
    read: true,
    timestamp: "1 week ago",
    user: {
      name: "Cooking King",
      username: "cookingking",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: "started following you",
  },
  {
    id: 10,
    type: "promotion",
    read: true,
    timestamp: "1 week ago",
    content: "Limited time offer: Get 20% off when you upgrade to an annual subscription!",
    action: "Learn More",
    actionLink: "/promotions/annual-discount",
  },
]

export default function Notifications() {
  const [hasNotifications, setHasNotifications] = useState(true)
  
  // Simulate checking for notifications
  useEffect(() => {
    // For now we're simulating an empty state by setting hasNotifications to false
    // In a real app, you would check if the user has any notifications
    setHasNotifications(false)
  }, [])
  
  // Count unread notifications by type
  const unreadCounts = {
    all: notifications.filter((n) => !n.read).length,
    mentions: notifications.filter((n) => n.type === "mention" && !n.read).length,
    comments: notifications.filter((n) => n.type === "comment" && !n.read).length,
    likes: notifications.filter((n) => n.type === "like" && !n.read).length,
    content: notifications.filter((n) => n.type === "content" && !n.read).length,
    system: notifications.filter(
      (n) => (n.type === "system" || n.type === "subscription" || n.type === "promotion") && !n.read,
    ).length,
  }

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
  }

  // If user has no notifications, show the empty state
  if (!hasNotifications) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Notifications</h1>
          </div>
          <EmptyNotifications />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
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
            <TabsTrigger value="content" className="data-[state=active]:bg-purple-900/30 relative">
              Content
              {unreadCounts.content > 0 && (
                <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCounts.content}</Badge>
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
                <CardTitle className="text-lg">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.read ? "bg-gray-900 border-gray-800" : "bg-gray-800/50 border-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {notification.user ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={notification.user.avatar || "/placeholder.svg"}
                            alt={notification.user.name}
                          />
                          <AvatarFallback className="bg-purple-900">{notification.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            {notification.user && <span className="font-medium">{notification.user.name} </span>}
                            <span className="text-gray-300">{notification.content}</span>
                            {notification.post && (
                              <a
                                href={notification.post.link}
                                className="block text-sm text-purple-400 hover:text-purple-300 mt-1"
                              >
                                {notification.post.title}
                              </a>
                            )}
                            {notification.tier && (
                              <div className="text-sm text-gray-400 mt-1">
                                {notification.tier.name} • {notification.tier.price}
                              </div>
                            )}
                            {notification.action && (
                              <a
                                href={notification.actionLink}
                                className="inline-block mt-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md"
                              >
                                {notification.action}
                              </a>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center text-xs text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {notification.timestamp}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white" align="end">
                                {!notification.read && <DropdownMenuItem>Mark as read</DropdownMenuItem>}
                                {notification.read && <DropdownMenuItem>Mark as unread</DropdownMenuItem>}
                                <DropdownMenuItem>Turn off notifications for this</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-800" />
                                <DropdownMenuItem className="text-red-400">Remove</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? "bg-gray-900 border-gray-800" : "bg-gray-800/50 border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={notification.user?.avatar || "/placeholder.svg"}
                            alt={notification.user?.name}
                          />
                          <AvatarFallback className="bg-purple-900">{notification.user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium">{notification.user?.name} </span>
                              <span className="text-gray-300">{notification.content}</span>
                              {notification.post && (
                                <a
                                  href={notification.post.link}
                                  className="block text-sm text-purple-400 hover:text-purple-300 mt-1"
                                >
                                  {notification.post.title}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {notification.timestamp}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white" align="end">
                                  {!notification.read && <DropdownMenuItem>Mark as read</DropdownMenuItem>}
                                  {notification.read && <DropdownMenuItem>Mark as unread</DropdownMenuItem>}
                                  <DropdownMenuItem>Turn off mentions from this user</DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-800" />
                                  <DropdownMenuItem className="text-red-400">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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

          <TabsContent value="comments" className="mt-6 space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {notifications
                  .filter((notification) => notification.type === "comment")
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? "bg-gray-900 border-gray-800" : "bg-gray-800/50 border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={notification.user?.avatar || "/placeholder.svg"}
                            alt={notification.user?.name}
                          />
                          <AvatarFallback className="bg-purple-900">{notification.user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium">{notification.user?.name} </span>
                              <span className="text-gray-300">{notification.content}</span>
                              {notification.post && (
                                <a
                                  href={notification.post.link}
                                  className="block text-sm text-purple-400 hover:text-purple-300 mt-1"
                                >
                                  {notification.post.title}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {notification.timestamp}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white" align="end">
                                  {!notification.read && <DropdownMenuItem>Mark as read</DropdownMenuItem>}
                                  {notification.read && <DropdownMenuItem>Mark as unread</DropdownMenuItem>}
                                  <DropdownMenuItem>View comment</DropdownMenuItem>
                                  <DropdownMenuItem>Reply</DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-800" />
                                  <DropdownMenuItem className="text-red-400">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {notifications.filter((notification) => notification.type === "comment").length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No comment notifications</p>
                    <p className="text-sm mt-1">When someone comments on your posts, it will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="likes" className="mt-6 space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Likes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {notifications
                  .filter((notification) => notification.type === "like")
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? "bg-gray-900 border-gray-800" : "bg-gray-800/50 border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={notification.user?.avatar || "/placeholder.svg"}
                            alt={notification.user?.name}
                          />
                          <AvatarFallback className="bg-purple-900">{notification.user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium">{notification.user?.name} </span>
                              <span className="text-gray-300">{notification.content}</span>
                              {notification.post && (
                                <a
                                  href={notification.post.link}
                                  className="block text-sm text-purple-400 hover:text-purple-300 mt-1"
                                >
                                  {notification.post.title}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {notification.timestamp}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white" align="end">
                                  {!notification.read && <DropdownMenuItem>Mark as read</DropdownMenuItem>}
                                  {notification.read && <DropdownMenuItem>Mark as unread</DropdownMenuItem>}
                                  <DropdownMenuItem>View post</DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-800" />
                                  <DropdownMenuItem className="text-red-400">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {notifications.filter((notification) => notification.type === "like").length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No likes yet</p>
                    <p className="text-sm mt-1">When someone likes your content, it will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">New Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {notifications
                  .filter((notification) => notification.type === "content")
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? "bg-gray-900 border-gray-800" : "bg-gray-800/50 border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={notification.user?.avatar || "/placeholder.svg"}
                            alt={notification.user?.name}
                          />
                          <AvatarFallback className="bg-purple-900">{notification.user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium">{notification.user?.name} </span>
                              <span className="text-gray-300">{notification.content}</span>
                              {notification.post && (
                                <a
                                  href={notification.post.link}
                                  className="block text-sm text-purple-400 hover:text-purple-300 mt-1"
                                >
                                  {notification.post.title}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {notification.timestamp}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white" align="end">
                                  {!notification.read && <DropdownMenuItem>Mark as read</DropdownMenuItem>}
                                  {notification.read && <DropdownMenuItem>Mark as unread</DropdownMenuItem>}
                                  <DropdownMenuItem>View content</DropdownMenuItem>
                                  <DropdownMenuItem>Turn off notifications from this creator</DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-800" />
                                  <DropdownMenuItem className="text-red-400">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {notifications.filter((notification) => notification.type === "content").length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No new content notifications</p>
                    <p className="text-sm mt-1">When creators you follow post new content, it will appear here</p>
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
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? "bg-gray-900 border-gray-800" : "bg-gray-800/50 border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {notification.user ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={notification.user.avatar || "/placeholder.svg"}
                              alt={notification.user.name}
                            />
                            <AvatarFallback className="bg-purple-900">
                              {notification.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                            {notification.type === "subscription" ? (
                              <DollarSign className="h-5 w-5 text-green-400" />
                            ) : notification.type === "promotion" ? (
                              <Gift className="h-5 w-5 text-pink-400" />
                            ) : (
                              <Bell className="h-5 w-5 text-orange-400" />
                            )}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              {notification.user && <span className="font-medium">{notification.user.name} </span>}
                              <span className="text-gray-300">{notification.content}</span>
                              {notification.tier && (
                                <div className="text-sm text-gray-400 mt-1">
                                  {notification.tier.name} • {notification.tier.price}
                                </div>
                              )}
                              {notification.action && (
                                <a
                                  href={notification.actionLink}
                                  className="inline-block mt-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md"
                                >
                                  {notification.action}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {notification.timestamp}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white" align="end">
                                  {!notification.read && <DropdownMenuItem>Mark as read</DropdownMenuItem>}
                                  {notification.read && <DropdownMenuItem>Mark as unread</DropdownMenuItem>}
                                  {notification.action && <DropdownMenuItem>{notification.action}</DropdownMenuItem>}
                                  <DropdownMenuSeparator className="bg-gray-800" />
                                  <DropdownMenuItem className="text-red-400">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
    </MainLayout>
  )
}
