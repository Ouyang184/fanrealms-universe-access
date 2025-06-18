
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NSFWBadge } from "@/components/ui/nsfw-badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Users, Star, Info } from "lucide-react";

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
  onNavigateToAbout: () => void;
  optimisticFollowerCount: number | null;
}

export function CreatorHeader({
  creator,
  isFollowing,
  onFollow,
  onUnfollow,
  onNavigateToAbout,
  optimisticFollowerCount
}: CreatorHeaderProps) {
  const displayFollowerCount = optimisticFollowerCount !== null 
    ? optimisticFollowerCount 
    : creator.follower_count || 0;

  const displayName = creator.display_name || creator.username || 'Creator';
  
  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {creator.banner_url && (
          <img
            src={creator.banner_url}
            alt="Creator banner"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 md:-mt-20">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
              <AvatarImage 
                src={creator.profile_image_url || undefined} 
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* NSFW Badge on Avatar */}
            {creator.is_nsfw && (
              <div className="absolute -top-2 -right-2">
                <NSFWBadge variant="profile" />
              </div>
            )}
          </div>

          {/* Creator Info */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                {creator.is_nsfw && (
                  <NSFWBadge variant="profile" />
                )}
              </div>
              
              {creator.bio && (
                <p className="text-muted-foreground max-w-2xl">{creator.bio}</p>
              )}
            </div>

            {/* Stats and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{displayFollowerCount.toLocaleString()}</span>
                  <span>followers</span>
                </div>
                
                {creator.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(creator.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToAbout}
                  className="gap-2"
                >
                  <Info className="h-4 w-4" />
                  About
                </Button>
                
                {isFollowing ? (
                  <Button onClick={onUnfollow} variant="secondary" className="gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    Following
                  </Button>
                ) : (
                  <Button onClick={onFollow} className="gap-2">
                    <Users className="h-4 w-4" />
                    Follow
                  </Button>
                )}
              </div>
            </div>

            {/* Tags */}
            {creator.tags && creator.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {creator.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
