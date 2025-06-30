
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, FileText, ImageIcon, Video, Music } from "lucide-react";
import { CreatorPost } from "@/types/creator-studio";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

interface ContentCalendarModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  posts: CreatorPost[];
}

export function ContentCalendarModal({ isOpen, onOpenChange, posts }: ContentCalendarModalProps) {
  const [viewMonth, setViewMonth] = useState<Date>(new Date(2025, 0, 1));

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return isSameDay(postDate, date);
    });
  };

  // Generate calendar days including leading/trailing days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const calendarDays = generateCalendarDays();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(viewMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setViewMonth(newMonth);
  };

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

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === viewMonth.getMonth();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5" />
            Content Calendar
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              {format(viewMonth, "MMMM yyyy")}
            </h3>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="bg-gray-800 rounded-lg p-4">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center font-medium text-gray-300 text-sm"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayPosts = getPostsForDate(date);
                const isInCurrentMonth = isCurrentMonth(date);
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[120px] p-2 border border-gray-700 bg-gray-900 rounded",
                      !isInCurrentMonth && "opacity-40"
                    )}
                  >
                    {/* Day Number */}
                    <div className="text-sm font-medium text-white mb-1">
                      {format(date, "d")}
                    </div>
                    
                    {/* Post Bands */}
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map((post, postIndex) => (
                        <div
                          key={post.id}
                          className={cn(
                            "text-xs px-2 py-1 rounded text-white truncate",
                            post.status === "published" 
                              ? "bg-blue-600" 
                              : post.status === "scheduled" 
                              ? "bg-indigo-600" 
                              : "bg-gray-600"
                          )}
                          title={post.title}
                        >
                          <div className="flex items-center gap-1">
                            {getPostTypeIcon(post.type)}
                            <span className="truncate">{post.title}</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show count if more than 3 posts */}
                      {dayPosts.length > 3 && (
                        <div className="text-xs text-gray-400 px-2 py-1">
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-600"></div>
              <span>Published</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-600"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-600"></div>
              <span>Draft</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
