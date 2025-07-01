
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface ScheduleTimeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSchedule: (date: Date) => void;
  postTitle: string;
}

export function ScheduleTimeDialog({
  isOpen,
  onOpenChange,
  selectedDate,
  onSchedule,
  postTitle
}: ScheduleTimeDialogProps) {
  const [selectedHour, setSelectedHour] = useState<string>("12");
  const [selectedMinute, setSelectedMinute] = useState<string>("00");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("PM");

  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return hour.toString();
  });

  const minutes = ["00", "15", "30", "45"];

  const handleSchedule = () => {
    if (!selectedDate) return;

    // Convert 12-hour format to 24-hour format
    let hour24 = parseInt(selectedHour);
    if (selectedPeriod === "AM" && hour24 === 12) {
      hour24 = 0;
    } else if (selectedPeriod === "PM" && hour24 !== 12) {
      hour24 += 12;
    }

    // Create the scheduled date with the selected time
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hour24, parseInt(selectedMinute), 0, 0);

    onSchedule(scheduledDateTime);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    return format(selectedDate, "EEEE, MMMM d, yyyy");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-4 w-4" />
            Schedule Time
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Date Display */}
          <div className="p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              Date
            </div>
            <div className="text-sm font-medium">{formatSelectedDate()}</div>
          </div>

          {/* Post Preview */}
          <div className="p-2 bg-muted/50 rounded-md">
            <div className="text-xs text-muted-foreground mb-1">Post:</div>
            <div className="text-sm font-medium truncate">{postTitle || "Untitled Post"}</div>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Select Time</Label>
            <div className="flex items-center gap-2">
              {/* Hour */}
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger className="w-16 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  side="bottom" 
                  align="center" 
                  sideOffset={4}
                  className="max-h-[200px] overflow-y-auto"
                  position="popper"
                >
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour} className="text-sm">
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm font-medium">:</span>

              {/* Minute */}
              <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                <SelectTrigger className="w-16 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  side="bottom" 
                  align="center" 
                  sideOffset={4}
                  position="popper"
                >
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute} className="text-sm">
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AM/PM */}
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-16 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  side="bottom" 
                  align="center" 
                  sideOffset={4}
                  position="popper"
                >
                  <SelectItem value="AM" className="text-sm">AM</SelectItem>
                  <SelectItem value="PM" className="text-sm">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Time Preview */}
          <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-xs text-blue-600 mb-1">Scheduled for:</div>
            <div className="text-sm font-medium text-blue-800">
              {formatSelectedDate()} at {selectedHour}:{selectedMinute} {selectedPeriod}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSchedule}>
              <Calendar className="mr-1 h-3 w-3" />
              Schedule Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
