
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CreatorProfile } from "@/types";

interface CreatorProfileCardProps {
  creator: Partial<CreatorProfile>;
  isLoading?: boolean;
}

const CreatorProfileCard: React.FC<CreatorProfileCardProps> = ({ creator, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/30 to-secondary/30 relative" />
        <CardContent className="pt-0 pb-5 px-5">
          <div className="flex flex-col items-center -mt-12 mb-4">
            <div className="h-24 w-24 rounded-full bg-background border-4 border-background" />
            <div className="h-5 w-32 bg-muted mt-3 rounded" />
            <div className="h-4 w-48 bg-muted mt-2 rounded" />
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
  
  // Get avatar URL with fallbacks
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
        </div>
        <div className="flex justify-center">
          <Button asChild>
            <Link to={creatorUrl}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorProfileCard;
