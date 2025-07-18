import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorRatingDisplayProps {
  rating: number;
  count: number;
  size?: "sm" | "md";
  className?: string;
}

export function CreatorRatingDisplay({ 
  rating, 
  count, 
  size = "sm",
  className 
}: CreatorRatingDisplayProps) {
  if (count === 0) {
    return (
      <div className={cn("flex items-center text-muted-foreground", className)}>
        <Star className={cn("h-3 w-3 mr-1", size === "md" && "h-4 w-4")} />
        <span className={cn("text-xs", size === "md" && "text-sm")}>
          No ratings
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Star className={cn(
        "h-3 w-3 mr-1 fill-yellow-400 text-yellow-400",
        size === "md" && "h-4 w-4"
      )} />
      <span className={cn(
        "text-xs font-medium",
        size === "md" && "text-sm"
      )}>
        {rating.toFixed(1)}
      </span>
      <span className={cn(
        "text-xs text-muted-foreground ml-1",
        size === "md" && "text-sm"
      )}>
        ({count})
      </span>
    </div>
  );
}