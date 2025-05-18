
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  DollarSign,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck"

// Sample data for the dashboard
const dashboardData = {
  stats: {
    subscribers: {
      total: 1248,
      change: 34,
      percentage: 5.2,
      trend: "up",
    },
    revenue: {
      total: 4385.72,
      change: 512.25,
      percentage: 8.7,
      trend: "up",
    },
  },
  recentContent: [
    {
      id: 1,
      title: "Character Design Masterclass Part 3",
      type: "video",
      thumbnail: "/placeholder.svg?height=120&width=200",
      date: "2 days ago",
      stats: {
        views: 1245,
        likes: 87,
        comments: 32,
      },
      tier: "Pro Artist",
    },
    {
      id: 2,
      title: "Digital Painting Techniques: Lighting",
      type: "tutorial",
      thumbnail: "/placeholder.svg?height=120&width=200",
      date: "5 days ago",
      stats: {
        views: 876,
        likes: 54,
        comments: 18,
      },
      tier: "Premium",
    },
    {
      id: 3,
      title: "May Brushes Pack",
      type: "download",
      thumbnail: "/placeholder.svg?height=120&width=200",
      date: "1 week ago",
      stats: {
        views: 2134,
        likes: 145,
        comments: 27,
      },
      tier: "Basic",
    },
  ],
  contentCalendar: [
    {
      id: 1,
      title: "Character Design Masterclass Part 4",
      date: "May 20, 2025",
      time: "3:00 PM",
      type: "Scheduled Post",
      status: "scheduled",
    },
    {
      id: 2,
      title: "Live Q&A Session",
      date: "May 22, 2025",
      time: "6:00 PM",
      type: "Live Stream",
      status: "scheduled",
    },
    {
      id: 3,
      title: "June Brushes Pack",
      date: "June 1, 2025",
      time: "10:00 AM",
      type: "Download",
      status: "draft",
    },
  ],
  tierPerformance: [
    {
      name: "Basic",
      price: 5.0,
      subscribers: 523,
      percentage: 42,
      revenue: 2615.0,
    },
    {
      name: "Premium",
      price: 15.0,
      subscribers: 412,
      percentage: 33,
      revenue: 6180.0,
    },
    {
      name: "Pro Artist",
      price: 25.0,
      subscribers: 313,
      percentage: 25,
      revenue: 7825.0,
    },
  ],
}

export default function Dashboard() {
  return (
    <CreatorCheck>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Creator Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your creator account.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Post
            </Button>
          </div>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className={`${
                    dashboardData.stats.subscribers.trend === "up"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  } flex items-center gap-1`}
                >
                  {dashboardData.stats.subscribers.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {dashboardData.stats.subscribers.percentage}%
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-muted-foreground text-sm">Total Subscribers</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{dashboardData.stats.subscribers.total.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">
                    {dashboardData.stats.subscribers.trend === "up" ? "+" : "-"}
                    {Math.abs(dashboardData.stats.subscribers.change)} this month
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <Badge
                  variant="outline"
                  className={`${
                    dashboardData.stats.revenue.trend === "up"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  } flex items-center gap-1`}
                >
                  {dashboardData.stats.revenue.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {dashboardData.stats.revenue.percentage}%
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-muted-foreground text-sm">Monthly Revenue</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">${dashboardData.stats.revenue.total.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">
                    {dashboardData.stats.revenue.trend === "up" ? "+" : "-"}$
                    {Math.abs(dashboardData.stats.revenue.change)} this month
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Performance */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Recent Content Performance</CardTitle>
                  <Button variant="link" className="text-primary p-0">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <CardDescription>How your recent content is performing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentContent.map((content) => (
                    <div key={content.id} className="flex gap-4 p-3 rounded-lg border bg-muted/20">
                      <div className="relative w-24 h-16 flex-shrink-0 rounded-md overflow-hidden">
                        <img
                          src={content.thumbnail || "/placeholder.svg"}
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-background/70 px-1.5 py-0.5 rounded text-xs">
                          {content.type === "video" && "Video"}
                          {content.type === "tutorial" && "Tutorial"}
                          {content.type === "download" && "Download"}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium line-clamp-1">{content.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Badge className="bg-primary text-xs mr-2">{content.tier}</Badge>
                              <Clock className="h-3 w-3 mr-1" />
                              {content.date}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Content</DropdownMenuItem>
                              <DropdownMenuItem>Edit Content</DropdownMenuItem>
                              <DropdownMenuItem>View Analytics</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Delete Content</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span>{content.stats.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Heart className="h-3 w-3 text-red-500" />
                            <span>{content.stats.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <MessageSquare className="h-3 w-3 text-green-500" />
                            <span>{content.stats.comments.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Share2 className="h-3 w-3 text-blue-500" />
                            <span>Share</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button className="w-full">Create New Content</Button>
              </CardFooter>
            </Card>

            {/* Content Calendar */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Content Calendar</CardTitle>
                  <Button variant="link" className="text-primary p-0">
                    View Full Calendar <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <CardDescription>Upcoming scheduled content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.contentCalendar.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-muted-foreground">{item.date.split(" ")[0]}</span>
                        <span className="font-bold">{item.date.split(" ")[1].replace(",", "")}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.time} • {item.type}
                        </div>
                      </div>
                      <Badge
                        variant={item.status === "scheduled" ? "default" : "outline"}
                        className={
                          item.status === "scheduled"
                            ? "bg-green-500 text-white"
                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        }
                      >
                        {item.status === "scheduled" ? "Scheduled" : "Draft"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule New Content
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Membership Tiers */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Membership Tiers</CardTitle>
                  <Button variant="link" className="text-primary p-0">
                    Manage Tiers <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <CardDescription>Performance of your membership tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.tierPerformance.map((tier) => (
                    <div key={tier.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              tier.name === "Basic"
                                ? "bg-blue-500"
                                : tier.name === "Premium"
                                  ? "bg-primary"
                                  : "bg-green-500"
                            }
                          >
                            {tier.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">${tier.price.toFixed(2)}/month</span>
                        </div>
                        <div className="text-sm font-medium">{tier.subscribers} subscribers</div>
                      </div>
                      <Progress value={tier.percentage} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{tier.percentage}% of subscribers</span>
                        <span>${tier.revenue.toLocaleString()} monthly revenue</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Tier
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </CreatorCheck>
  )
}
