
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
  Loader2,
} from "lucide-react"
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck"
import { useCreatorDashboard } from "@/hooks/useCreatorDashboard"
import { useCreatorSubscribers } from "@/hooks/useCreatorSubscribers"
import { Link } from "react-router-dom"
import LoadingSpinner from "@/components/LoadingSpinner"
import { formatRelativeDate } from "@/utils/auth-helpers"
import { useCreatorPosts } from "@/hooks/useCreatorPosts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useMemo } from "react"

export default function Dashboard() {
  const { user } = useAuth();
  const { creatorProfile, posts, isLoading: dashboardLoading } = useCreatorDashboard();
  const { posts: creatorPosts, isLoading: isLoadingPosts } = useCreatorPosts();
  
  // Get real subscriber data
  const { subscribers, isLoading: subscribersLoading } = useCreatorSubscribers(creatorProfile?.id || '');
  
  // Get membership tiers with real subscriber counts
  const { data: tiersWithCounts = [], isLoading: tiersLoading } = useQuery({
    queryKey: ['dashboard-tiers-with-counts', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      // Get all membership tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('price', { ascending: true });
        
      if (tiersError) throw tiersError;
      
      // Get subscriber counts for each tier from real subscription data
      const tiersWithRealCounts = tiers.map(tier => {
        const tierSubscribers = subscribers?.filter(sub => 
          sub.tier_id === tier.id && sub.status === 'active'
        ) || [];
        
        const subscriberCount = tierSubscribers.length;
        const revenue = subscriberCount * (tier.price || 0);
        const totalActiveSubscribers = subscribers?.filter(sub => sub.status === 'active').length || 0;
        const percentage = totalActiveSubscribers > 0 ? Math.round((subscriberCount / totalActiveSubscribers) * 100) : 0;
        
        return {
          id: tier.id,
          name: tier.title,
          title: tier.title,
          price: Number(tier.price),
          subscribers: subscriberCount,
          percentage,
          revenue,
          revenueChange: 0, // Could be calculated with historical data
          previousSubscribers: 0, // Could be calculated with historical data
          growth: 0, // Could be calculated with historical data
        };
      });
      
      return tiersWithRealCounts;
    },
    enabled: !!creatorProfile?.id && !!subscribers,
    staleTime: 300000, // 5 minutes
  });

  // Calculate real month-over-month statistics
  const monthlyStats = useMemo(() => {
    if (!subscribers || subscribers.length === 0) {
      return {
        currentMonthSubscribers: 0,
        previousMonthSubscribers: 0,
        subscriberChange: 0,
        subscriberGrowthPercentage: 0,
        currentRevenue: 0,
        previousRevenue: 0,
        revenueChange: 0,
        revenueGrowthPercentage: 0
      };
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month active subscribers
    const currentActiveSubscribers = subscribers.filter(sub => 
      sub.status === 'active' && new Date(sub.created_at) >= currentMonthStart
    );

    // Previous month active subscribers
    const previousActiveSubscribers = subscribers.filter(sub => 
      sub.status === 'active' && 
      new Date(sub.created_at) >= previousMonthStart && 
      new Date(sub.created_at) <= previousMonthEnd
    );

    // Total active subscribers (for current revenue)
    const totalActiveSubscribers = subscribers.filter(sub => sub.status === 'active');

    // Calculate revenues
    const currentRevenue = totalActiveSubscribers.reduce((total, sub) => total + (sub.amount || 0), 0);
    const previousRevenue = previousActiveSubscribers.reduce((total, sub) => total + (sub.amount || 0), 0);

    const subscriberChange = currentActiveSubscribers.length - previousActiveSubscribers.length;
    const revenueChange = currentRevenue - previousRevenue;

    const subscriberGrowthPercentage = previousActiveSubscribers.length > 0 
      ? Math.round(((currentActiveSubscribers.length - previousActiveSubscribers.length) / previousActiveSubscribers.length) * 100)
      : currentActiveSubscribers.length > 0 ? 100 : 0;

    const revenueGrowthPercentage = previousRevenue > 0 
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    return {
      currentMonthSubscribers: currentActiveSubscribers.length,
      previousMonthSubscribers: previousActiveSubscribers.length,
      subscriberChange,
      subscriberGrowthPercentage,
      currentRevenue,
      previousRevenue,
      revenueChange,
      revenueGrowthPercentage,
      totalActiveSubscribers: totalActiveSubscribers.length
    };
  }, [subscribers]);

  const isLoading = dashboardLoading || subscribersLoading || tiersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // Find scheduled and draft posts from the creator posts
  const scheduledPosts = creatorPosts
    .filter(post => post.status === "scheduled")
    .slice(0, 3);
    
  const draftPosts = creatorPosts
    .filter(post => post.status === "draft")
    .slice(0, 3);
    
  // Combine scheduled and draft posts for the content calendar
  const contentCalendar = [...scheduledPosts, ...draftPosts]
    .sort((a, b) => {
      if (a.scheduleDate && b.scheduleDate) {
        return new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime();
      }
      if (a.scheduleDate && !b.scheduleDate) return -1;
      if (!a.scheduleDate && b.scheduleDate) return 1;
      return 0;
    })
    .slice(0, 3);

  // Helper function to get post thumbnail
  const getPostThumbnail = (post: any) => {
    if (post.attachments && Array.isArray(post.attachments)) {
      const imageAttachment = post.attachments.find(
        (attachment: any) => attachment.type === 'image'
      );
      if (imageAttachment) {
        return imageAttachment.url;
      }
    }
    return `/placeholder.svg?seed=${post.id}`;
  };

  return (
    <CreatorCheck>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Creator Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your creator account.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="gap-2">
              <Link to="/creator-studio/posts">
                <Plus className="h-4 w-4" />
                Create New Post
              </Link>
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
                    monthlyStats.subscriberGrowthPercentage >= 0 
                      ? "bg-green-500/10 text-green-500 border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  } flex items-center gap-1`}
                >
                  {monthlyStats.subscriberGrowthPercentage >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(monthlyStats.subscriberGrowthPercentage)}%
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-muted-foreground text-sm">Total Subscribers</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{monthlyStats.totalActiveSubscribers.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">
                    {monthlyStats.subscriberChange >= 0 ? '+' : ''}{monthlyStats.subscriberChange} this month
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
                    monthlyStats.revenueGrowthPercentage >= 0 
                      ? "bg-green-500/10 text-green-500 border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  } flex items-center gap-1`}
                >
                  {monthlyStats.revenueGrowthPercentage >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(monthlyStats.revenueGrowthPercentage)}%
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-muted-foreground text-sm">Monthly Revenue</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">${monthlyStats.currentRevenue.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">
                    {monthlyStats.revenueChange >= 0 ? '+' : ''}${Math.abs(monthlyStats.revenueChange).toFixed(2)} this month
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
                  <Button variant="link" asChild className="text-primary p-0">
                    <Link to="/creator-studio/posts">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>How your recent content is performing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <div key={post.id} className="flex gap-4 p-3 rounded-lg border bg-muted/20">
                        <div className="relative w-24 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                          <img
                            src={getPostThumbnail(post)}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-background/70 px-1.5 py-0.5 rounded text-xs">
                            Post
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium line-clamp-1">{post.title}</h3>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                {post.tier_id && (
                                  <Badge className="bg-primary text-xs mr-2">Premium</Badge>
                                )}
                                <Clock className="h-3 w-3 mr-1" />
                                {post.date}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Post</DropdownMenuItem>
                                <DropdownMenuItem>Edit Post</DropdownMenuItem>
                                <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">Delete Post</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Eye className="h-3 w-3 text-muted-foreground" />
                              <span>--</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Heart className="h-3 w-3 text-red-500" />
                              <span>--</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <MessageSquare className="h-3 w-3 text-green-500" />
                              <span>--</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Share2 className="h-3 w-3 text-blue-500" />
                              <span>Share</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">You haven't created any posts yet.</p>
                      <Button asChild>
                        <Link to="/creator-studio/posts">Create Your First Post</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button asChild className="w-full">
                  <Link to="/creator-studio/posts">Create New Content</Link>
                </Button>
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
                {contentCalendar.length > 0 ? (
                  <div className="space-y-4">
                    {contentCalendar.map((item) => {
                      const date = item.scheduleDate ? new Date(item.scheduleDate) : new Date();
                      const month = date.toLocaleString('default', { month: 'short' });
                      const day = date.getDate();
                      const time = item.scheduleDate 
                        ? new Date(item.scheduleDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                        : "No Time";
                      
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20"
                        >
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-muted-foreground">{month}</span>
                            <span className="font-bold">{day}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{item.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {time} • {item.type || "Post"}
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
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">You don't have any scheduled content.</p>
                    <Button variant="outline" asChild>
                      <Link to="/creator-studio/posts">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Your First Post
                      </Link>
                    </Button>
                  </div>
                )}
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
                  <Button variant="link" asChild className="text-primary p-0">
                    <Link to="/creator-studio/membership-tiers">
                      Manage Tiers <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>Performance of your membership tiers</CardDescription>
              </CardHeader>
              <CardContent>
                {tiersWithCounts.length > 0 ? (
                  <div className="space-y-4">
                    {tiersWithCounts.map((tier) => (
                      <div key={tier.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                tier.price <= 5
                                  ? "bg-blue-500"
                                  : tier.price <= 15
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
                          <span>${tier.revenue.toFixed(2)} monthly revenue</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">You haven't created any membership tiers yet.</p>
                    <Button asChild>
                      <Link to="/creator-studio/membership-tiers">Create Your First Tier</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/creator-studio/membership-tiers">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Tier
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </CreatorCheck>
  )
}
