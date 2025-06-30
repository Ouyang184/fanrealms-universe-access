
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, ImageIcon, Video, Music } from "lucide-react";
import { CreatorPost } from "@/types/creator-studio";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface ContentCalendarModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  posts: CreatorPost[];
}

export function ContentCalendarModal({ isOpen, onOpenChange, posts }: ContentCalendarModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 0, 1)); // Start from January 2025
  const [viewMonth, setViewMonth] = useState<Date>(new Date(2025, 0, 1));

  // Get posts for the selected date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return isSameDay(postDate, date);
    });
  };

  // Get all days in the current month that have posts
  const getDaysWithPosts = () => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth.filter(day => {
      return posts.some(post => {
        const postDate = new Date(post.createdAt);
        return isSameDay(postDate, day);
      });
    });
  };

  const daysWithPosts = getDaysWithPosts();
  const selectedDatePosts = getPostsForDate(selectedDate);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-3 w-3" />;
      case "image":
        return <ImageIcon className="h-3 w-3" />;
      case "video":
        return <Video className="h-3 w-3" />;
      case "audio":
        return <Music className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(viewMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setViewMonth(newMonth);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Content Calendar
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {format(viewMonth, "MMMM yyyy")}
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={viewMonth}
              onMonthChange={setViewMonth}
              className="rounded-md border"
              modifiers={{
                hasPost: daysWithPosts
              }}
              modifiersStyles={{
                hasPost: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                }
              }}
            />
            
            <div className="text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary"></div>
                Days with posts
              </p>
            </div>
          </div>

          {/* Posts for Selected Date */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Posts for {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            {selectedDatePosts.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedDatePosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium line-clamp-1">{post.title}</h4>
                      <Badge
                        variant={post.status === "published" ? "default" : "outline"}
                        className={cn(
                          post.status === "published"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : post.status === "scheduled"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        )}
                      >
                        {post.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getPostTypeIcon(post.type)}
                        <span className="capitalize">{post.type}</span>
                      </div>
                      <span>{format(new Date(post.createdAt), "h:mm a")}</span>
                    </div>
                    
                    {post.engagement && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{post.engagement.views} views</span>
                        <span>{post.engagement.likes} likes</span>
                        <span>{post.engagement.comments} comments</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No posts on this date</p>
                <p className="text-sm mt-1">Select a highlighted date to see posts</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
