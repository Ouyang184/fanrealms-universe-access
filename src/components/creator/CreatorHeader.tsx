
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Calendar, Users } from "lucide-react";
import { SubscribeButton } from "./SubscribeButton";
import type { Creator } from "@/types";

interface CreatorHeaderProps {
  creator: Creator;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  isOwnProfile?: boolean;
}

export function CreatorHeader({ 
  creator, 
  isFollowing, 
  onFollow, 
  onUnfollow,
  isOwnProfile = false 
}: CreatorHeaderProps) {
  return (
    <div className="relative">
      {/* Banner Image */}
      {creator.banner_url ? (
        <div className="w-full h-48 md:h-64 overflow-hidden rounded-t-lg">
          <img 
            src={creator.banner_url} 
            alt={`${creator.display_name || creator.username}'s banner`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg" />
      )}
      
      {/* Profile Content */}
      <div className="relative -mt-16 px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          {/* Avatar and basic info */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <Avatar className="w-32 h-32 border-4 border-background">
              <AvatarImage 
                src={creator.profile_image_url || creator.avatar_url} 
                alt={creator.display_name || creator.username} 
              />
              <AvatarFallback className="text-2xl">
                {(creator.display_name || creator.username)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col gap-2">
              <div>
                <h1 className="text-2xl font-bold">
                  {creator.display_name || creator.username}
                </h1>
                {creator.display_name && (
                  <p className="text-muted-foreground">@{creator.username}</p>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{creator.follower_count || 0} followers</span>
                </div>
                {creator.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(creator.created_at).getFullYear()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2">
              <SubscribeButton creator={creator} />
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={isFollowing ? onUnfollow : onFollow}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </div>
          )}
        </div>
        
        {/* Bio and additional info */}
        <div className="mt-6 space-y-4">
          {creator.bio && (
            <p className="text-foreground">{creator.bio}</p>
          )}
          
          {/* Tags */}
          {creator.tags && creator.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {creator.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Website link */}
          {creator.website && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <a 
                href={creator.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {creator.website}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
