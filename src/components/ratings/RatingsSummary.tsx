import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "./StarRating";
import { RatingStats } from "@/hooks/useCreatorRatings";
import { Star } from "lucide-react";

interface RatingsSummaryProps {
  stats: RatingStats;
  isLoading?: boolean;
}

export function RatingsSummary({ stats, isLoading }: RatingsSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ratings Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-6 w-20 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <div className="h-4 w-8 bg-muted rounded" />
                <div className="flex-1 h-2 bg-muted rounded" />
                <div className="h-4 w-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { average, count, distribution } = stats;

  if (count === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ratings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No ratings yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Ratings Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">
            {average.toFixed(1)}
          </div>
          <div className="flex flex-col">
            <StarRating rating={average} size="sm" readonly />
            <p className="text-sm text-muted-foreground">
              {count} {count === 1 ? "rating" : "ratings"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const starCount = distribution[star] || 0;
            const percentage = count > 0 ? (starCount / count) * 100 : 0;
            
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right">{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Progress value={percentage} className="flex-1 h-2" />
                <span className="w-8 text-muted-foreground">{starCount}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}