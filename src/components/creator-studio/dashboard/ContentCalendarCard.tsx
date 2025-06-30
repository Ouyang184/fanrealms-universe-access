
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar, Clock, MoreHorizontal, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { CreatorPost } from "@/types/creator-studio";
import { usePostShares } from "@/hooks/usePostShares";

interface ContentCalendarCardProps {
  creatorPosts: CreatorPost[];
}

export function ContentCalendarCard({ creatorPosts }: ContentCalendarCardProps) {
  const scheduledPosts = creatorPosts
    .filter(post => post.status === "scheduled")
    .slice(0, 3);
    
  const draftPosts = creatorPosts
    .filter(post => post.status === "draft")
    .slice(0, 3);
    
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Content Calendar</CardTitle>
          <Button variant="link" className="text-primary p-0" asChild>
            <Link to="/creator-studio/content-calendar">
              View Full Calendar <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
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
                <PostCalendarItem key={item.id} item={item} month={month} day={day} time={time} />
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">You don't have any scheduled content.</p>
            <Button variant="outline" asChild>
              <Link to="/creator-studio/content-calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Your First Post
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link to="/creator-studio/content-calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule New Content
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function PostCalendarItem({ item, month, day, time }: { 
  item: CreatorPost; 
  month: string; 
  day: number; 
  time: string; 
}) {
  const { shareCount } = usePostShares(item.id);
  
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-muted-foreground">{month}</span>
        <span className="font-bold">{day}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{item.title}</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <Clock className="h-3 w-3 mr-1" />
          {time} • {item.type || "Post"}
          {item.status === "published" && shareCount > 0 && (
            <>
              <span className="mx-1">•</span>
              <Share2 className="h-3 w-3 mr-1" />
              {shareCount} shares
            </>
          )}
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
}
