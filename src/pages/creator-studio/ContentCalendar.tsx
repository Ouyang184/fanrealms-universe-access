
import { useState } from "react";
import { Calendar, Plus, Clock, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreatorPosts } from "@/hooks/useCreatorPosts";
import { CreatorPost } from "@/types/creator-studio";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { CreatePostForm } from "@/components/creator-studio/CreatePostForm";
import { Link } from "react-router-dom";

export default function ContentCalendar() {
  const { posts, isLoading } = useCreatorPosts();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filter and sort scheduled posts
  const scheduledPosts = posts
    .filter(post => post.status === "scheduled" && post.scheduleDate)
    .sort((a, b) => {
      const dateA = new Date(a.scheduleDate!);
      const dateB = new Date(b.scheduleDate!);
      return dateA.getTime() - dateB.getTime();
    });

  const getDateCategory = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isThisWeek(date)) return "This Week";
    return "Later";
  };

  const groupedPosts = scheduledPosts.reduce((acc, post) => {
    const category = getDateCategory(post.scheduleDate!);
    if (!acc[category]) acc[category] = [];
    acc[category].push(post);
    return acc;
  }, {} as Record<string, CreatorPost[]>);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage your upcoming content</p>
        </div>
        <div className="flex items-center gap-2">
          <CreatePostForm />
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Content List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Scheduled Content
              </CardTitle>
              <CardDescription>
                {scheduledPosts.length} posts scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">You don't have any scheduled content.</h3>
                  <p className="text-muted-foreground mb-6">Start by scheduling your first post to maintain a consistent content calendar.</p>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Your First Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPosts).map(([category, posts]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-lg mb-3 text-primary">{category}</h3>
                      <div className="space-y-3">
                        {posts.map((post) => (
                          <ScheduledPostCard key={post.id} post={post} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Content
              </Button>
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Full Calendar
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/creator-studio/posts">
                  <Edit className="h-4 w-4 mr-2" />
                  Manage Posts
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This week</span>
                  <Badge variant="secondary">
                    {posts.filter(p => p.scheduleDate && isThisWeek(new Date(p.scheduleDate))).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total scheduled</span>
                  <Badge variant="secondary">{scheduledPosts.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Published this month</span>
                  <Badge variant="secondary">
                    {posts.filter(p => p.status === "published").length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Scheduled Post Card Component
function ScheduledPostCard({ post }: { post: CreatorPost }) {
  const scheduleDate = new Date(post.scheduleDate!);
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">
            {format(scheduleDate, "MMM")}
          </span>
          <span className="font-bold text-sm">
            {format(scheduleDate, "d")}
          </span>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{post.title}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Clock className="h-3 w-3" />
          <span>{format(scheduleDate, "h:mm a")}</span>
          <span>•</span>
          <span className="capitalize">{post.type}</span>
          {post.tier_id && (
            <>
              <span>•</span>
              <Badge variant="outline" className="text-xs">Premium</Badge>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
