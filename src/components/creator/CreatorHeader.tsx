
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NSFWBadge } from "@/components/ui/nsfw-badge";
import { Calendar, Users, Star, Info } from "lucide-react";

interface CreatorHeaderProps {
  creator: {
    id: string;
    display_name?: string;
    username?: string;
    bio?: string;
    profile_image_url?: string;
    banner_url?: string;
    follower_count?: number;
    is_nsfw?: boolean;
    created_at?: string;
    tags?: string[];
  };
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onNavigateToAbout?: () => void;
  optimisticFollowerCount: number | null;
  isOwnProfile?: boolean;
}

export function CreatorHeader({
  creator, isFollowing, onFollow, onUnfollow, onNavigateToAbout, optimisticFollowerCount, isOwnProfile = false
}: CreatorHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayFollowerCount = creator.follower_count || 0;
  const displayName = creator.display_name || creator.username || 'Creator';
  
  const BIO_CHAR_LIMIT = 200;
  const shouldTruncate = creator.bio && creator.bio.length > BIO_CHAR_LIMIT;
  const displayBio = shouldTruncate && !isExpanded 
    ? creator.bio!.substring(0, BIO_CHAR_LIMIT).trim() + "..."
    : creator.bio;
  
  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 md:h-56 bg-muted relative overflow-hidden">
        {creator.banner_url && (
          <img src={creator.banner_url} alt="Creator banner" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Content */}
      <div className="relative px-6 pb-6 bg-background">
        <div className="absolute -top-16 left-6">
          <Avatar className="h-28 w-28 border-4 border-background">
            <AvatarImage src={creator.profile_image_url || undefined} alt={displayName} className="object-cover" />
            <AvatarFallback className="text-2xl bg-muted">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        <div className="pt-16 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {creator.is_nsfw && <NSFWBadge variant="profile" />}
          </div>

          {creator.bio && (
            <div className="space-y-1">
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed break-words">{displayBio}</p>
              {shouldTruncate && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-primary text-sm hover:underline">
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-medium">{displayFollowerCount.toLocaleString()}</span> followers
              </span>
              {creator.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(creator.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToAbout && (
                <Button variant="outline" size="sm" onClick={onNavigateToAbout}>
                  <Info className="h-4 w-4 mr-1" /> About
                </Button>
              )}
              {!isOwnProfile && (
                isFollowing ? (
                  <Button onClick={onUnfollow} variant="secondary" size="sm">
                    <Star className="h-4 w-4 mr-1 fill-current" /> Following
                  </Button>
                ) : (
                  <Button onClick={onFollow} size="sm">Follow</Button>
                )
              )}
            </div>
          </div>

          {creator.tags && creator.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {creator.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
