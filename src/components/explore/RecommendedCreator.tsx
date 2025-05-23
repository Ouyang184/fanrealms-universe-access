
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreatorProfile } from "@/types";

interface RecommendedCreatorProps {
  creator: CreatorProfile;
}

export function RecommendedCreator({ creator }: RecommendedCreatorProps) {
  // Helper function to get creator tags
  const getCreatorTags = (creator: CreatorProfile) => {
    // Extract tags from bio or default to category tags
    const defaultTags = ["Content Creator"];
    
    if (!creator) return defaultTags;
    
    const bio = creator.bio || "";
    // Extract hashtags or keywords from bio
    const extractedTags = bio.match(/#\w+/g) || [];
    const formattedTags = extractedTags.map(tag => tag.replace('#', ''));
    
    // If no tags found in bio, extract keywords
    if (formattedTags.length === 0 && bio) {
      const keywords = bio.split(' ')
        .filter(word => word.length > 4)
        .slice(0, 3);
      return keywords.length > 0 ? keywords : defaultTags;
    }
    
    return formattedTags.length > 0 ? formattedTags : defaultTags;
  };

  // Create proper route to creator profile
  const creatorLink = creator.username 
    ? `/creator/${creator.username}` 
    : `/creator/${creator.id}`;

  // Get display name with fallbacks
  const displayName = creator.display_name || creator.username || "Creator";

  // Get avatar URL with fallbacks
  const avatarUrl = creator.profile_image_url || creator.avatar_url;

  // Get first letter for avatar fallback
  const avatarFallback = (displayName || "C").substring(0, 1).toUpperCase();

  return (
    <Card className="bg-gray-900 border-gray-800 flex overflow-hidden">
      <div className="p-4 flex-shrink-0">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-gray-800 text-xl">{avatarFallback}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{displayName}</h3>
        </div>
        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{creator.bio || "Creator on FanRealms"}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {getCreatorTags(creator).slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700 text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm">
            <span className="text-gray-400">From </span>
            <span className="font-medium">${(9.99).toFixed(2)}/mo</span>
          </div>
          <Link to={creatorLink}>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              View Creator
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
