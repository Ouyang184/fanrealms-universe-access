
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { CreatorProfile } from "@/types";
import { CreatorRatingDisplay } from "@/components/ratings/CreatorRatingDisplay";
import { useCreatorRatingStats } from "@/hooks/useCreatorRatingStats";

interface CreatorProfileCardProps {
  creator: Partial<CreatorProfile>;
  isLoading?: boolean;
}

const CreatorProfileCard: React.FC<CreatorProfileCardProps> = ({ creator, isLoading = false }) => {
  // Fetch rating stats for this creator
  const { stats } = useCreatorRatingStats(creator.id ? [creator.id] : []);
  const ratingData = creator.id ? stats[creator.id] : null;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/30 to-secondary/30 relative" />
        <CardContent className="pt-0 pb-5 px-5">
          <div className="flex flex-col items-center -mt-12 mb-4">
            <div className="h-24 w-24 rounded-full bg-background border-4 border-background" />
            <div className="h-5 w-32 bg-muted mt-3 rounded" />
            <div className="h-4 w-48 bg-muted mt-2 rounded" />
            <div className="h-4 w-20 bg-muted mt-2 rounded" />
          </div>
          <div className="flex justify-center">
            <div className="h-9 w-28 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get proper display name from creator data with fallbacks
  const displayName = creator.display_name || creator.username || "Creator";
  
  // Get avatar URL with fallbacks - check both fields since different components might use different naming
  const avatarUrl = creator.avatar_url || creator.profile_image_url;
  
  // Create proper creator URL from username or ID
  const creatorUrl = creator.username 
    ? `/creator/${creator.username}` 
    : creator.id ? `/creator/${creator.id}` : "#";
  
  // Get first letter for avatar fallback
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-primary/30 to-secondary/30 relative" />
      <CardContent className="pt-0 pb-5 px-5">
        <div className="flex flex-col items-center -mt-12 mb-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-2xl">{avatarFallback}</AvatarFallback>
          </Avatar>
          <Link to={creatorUrl} className="mt-3 text-lg font-semibold hover:underline">
            {displayName}
          </Link>
          {creator.bio && <p className="text-sm text-center mt-2 line-clamp-2">{creator.bio}</p>}
          
          {/* Display rating if available */}
          {ratingData && (
            <div className="mt-2 flex justify-center">
              <CreatorRatingDisplay 
                rating={ratingData.average_rating} 
                count={ratingData.total_ratings}
                size="sm"
              />
            </div>
          )}
          
          {/* Display tags if available */}
          {creator.tags && creator.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {creator.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {creator.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{creator.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <Button asChild>
            <Link to={creatorUrl}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CreatorProfileCard;
