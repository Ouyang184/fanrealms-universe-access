
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Calendar, Users } from "lucide-react";
import { SubscribeButton } from "./SubscribeButton";
import { SocialLinks } from "@/components/SocialLinks";
import type { CreatorProfile } from "@/types";

interface CreatorHeaderProps {
  creator: CreatorProfile;
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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Left side: Avatar and basic info */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage 
                src={creator.profile_image_url || creator.avatar_url} 
                alt={creator.display_name || creator.username} 
              />
              <AvatarFallback className="text-2xl">
                {(creator.display_name || creator.username)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col gap-3">
              {/* Name and username */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {creator.display_name || creator.username}
                </h1>
                {creator.display_name && (
                  <p className="text-lg text-muted-foreground">@{creator.username}</p>
                )}
              </div>
              
              {/* Stats row */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{creator.follower_count || 0}</span>
                  <span>followers</span>
                </div>
                {creator.created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(creator.created_at).getFullYear()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side: Action buttons */}
          {!isOwnProfile && (
            <div className="flex flex-col gap-3 md:items-end">
              {creator.tiers && creator.tiers.length > 0 && (
                <div className="space-y-2">
                  {creator.tiers.map((tier) => (
                    <SubscribeButton
                      key={tier.id}
                      tierId={tier.id}
                      creatorId={creator.id}
                      tierName={tier.name}
                      price={tier.price}
                    />
                  ))}
                </div>
              )}
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={isFollowing ? onUnfollow : onFollow}
                className="min-w-[100px]"
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </div>
          )}
        </div>
        
        {/* Bio section - clearly separated */}
        {creator.bio && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="max-w-3xl">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About</h3>
              <p className="text-foreground leading-relaxed">{creator.bio}</p>
            </div>
          </div>
        )}
        
        {/* Tags section */}
        {creator.tags && creator.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {creator.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Links section */}
        <div className="mt-6 space-y-4">
          {/* Website link */}
          {creator.website && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Website</h3>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={creator.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {creator.website}
                </a>
              </div>
            </div>
          )}
          
          {/* Website links */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Website Links</h3>
            <SocialLinks 
              creatorId={creator.id} 
              variant="outline" 
              size="sm"
              showText={true}
              className="gap-3"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
