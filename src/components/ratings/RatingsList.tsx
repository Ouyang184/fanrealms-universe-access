import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { CreatorRating } from "@/hooks/useCreatorRatings";
import { formatDistanceToNow } from "date-fns";

interface RatingsListProps {
  ratings: CreatorRating[];
  isLoading?: boolean;
}

export function RatingsList({ ratings, isLoading }: RatingsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-16 w-full bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to share your experience!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <Card key={rating.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={rating.user?.profile_picture || undefined} />
                <AvatarFallback>
                  {rating.user?.username?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">
                      {rating.user?.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <StarRating rating={rating.rating} size="sm" readonly />
                </div>
                
                {rating.review_text && (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {rating.review_text}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}