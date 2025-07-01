
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek, isSameMonth, isToday, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ScheduleTimeDialog } from "./ScheduleTimeDialog";

interface SchedulePostCalendarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedulePost: (date: Date) => void;
  postTitle: string;
  postContent: string;
}

export function SchedulePostCalendar({ 
  isOpen, 
  onOpenChange, 
  onSchedulePost, 
  postTitle, 
  postContent 
}: SchedulePostCalendarProps) {
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);

  // Generate calendar days including leading/trailing days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const calendarDays = generateCalendarDays();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(viewMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setViewMonth(newMonth);
  };

  const handleDateClick = (date: Date) => {
    // Don't allow scheduling in the past
    if (isBefore(date, startOfDay(new Date()))) {
      return;
    }
    
    setSelectedDate(date);
    setIsTimeDialogOpen(true);
  };

  const handleTimeSchedule = (date: Date) => {
    setIsTimeDialogOpen(false);
    onSchedulePost(date);
    onOpenChange(false);
  };

  const isCurrentMonth = (date: Date) => {
    return isSameMonth(date, viewMonth);
  };

  const isPastDate = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Post
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Post Preview */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Post Preview:</h3>
              <h4 className="font-semibold">{postTitle || "Untitled Post"}</h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {postContent || "No content"}
              </p>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
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
            
            {/* Calendar Grid */}
            <div className="bg-background rounded-lg border p-4">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center font-medium text-muted-foreground text-sm"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const isInCurrentMonth = isCurrentMonth(date);
                  const isTodayDate = isToday(date);
                  const isPast = isPastDate(date);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      disabled={isPast}
                      className={cn(
                        "h-12 p-2 text-sm rounded border transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring",
                        !isInCurrentMonth && "text-muted-foreground opacity-50",
                        isTodayDate && "bg-primary text-primary-foreground font-semibold",
                        isPast && "opacity-30 cursor-not-allowed hover:bg-transparent",
                        !isPast && !isTodayDate && "hover:bg-muted"
                      )}
                    >
                      {format(date, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Instructions */}
            <div className="text-sm text-muted-foreground text-center">
              Click on a future date to schedule your post. Past dates are disabled.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScheduleTimeDialog
        isOpen={isTimeDialogOpen}
        onOpenChange={setIsTimeDialogOpen}
        selectedDate={selectedDate}
        onSchedule={handleTimeSchedule}
        postTitle={postTitle}
      />
    </>
  );
}
