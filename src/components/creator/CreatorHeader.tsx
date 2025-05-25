
import React, { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SocialLinks } from "@/components/SocialLinks";
import { CreatorProfile } from "@/types";
import { CreatorChatModal } from "@/components/messaging/CreatorChatModal";
import { useFollow } from "@/hooks/useFollow";

interface CreatorHeaderProps {
  creator: CreatorProfile & { displayName?: string };
}

export function CreatorHeader({ creator }: CreatorHeaderProps) {
  const [showChatModal, setShowChatModal] = useState(false);
  const { isFollowing, isLoading, checkFollowStatus, followCreator, unfollowCreator, setIsFollowing } = useFollow();
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  
  // Use display_name consistently
  const displayName = creator.display_name || creator.username || "Creator";
  const avatarUrl = creator.avatar_url || creator.profile_image_url;
  
  // Make sure we use the correct ID for the creator
  const creatorId = creator.id || creator.user_id;
  
  // Check follow status only once when component mounts
  const initializeFollowStatus = useCallback(async () => {
    if (creatorId && !hasCheckedStatus) {
      console.log("CreatorHeader checking follow status for:", creatorId);
      setHasCheckedStatus(true);
      try {
        const status = await checkFollowStatus(creatorId);
        setIsFollowing(status);
        console.log("Follow status set to:", status);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    }
  }, [creatorId, hasCheckedStatus, checkFollowStatus, setIsFollowing]);

  useEffect(() => {
    initializeFollowStatus();
  }, [initializeFollowStatus]);

  const handleFollowToggle = async () => {
    if (!creatorId) return;
    
    try {
      if (isFollowing) {
        await unfollowCreator(creatorId);
      } else {
        await followCreator(creatorId);
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    }
  };

  return (
    <>
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-lg overflow-hidden">
          {creator.banner_url ? (
            <img 
              src={creator.banner_url} 
              alt="Creator Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/30 to-secondary/30" />
          )}
        </div>
        <div className="flex flex-col md:flex-row items-center md:items-end p-4 -mt-16 md:-mt-12">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-4xl">
              {(displayName || "C").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground mt-1">
              {(creator.follower_count || 0).toLocaleString()} followers
            </p>
            
            {creatorId && (
              <div className="mt-2">
                <SocialLinks creatorId={creatorId} showText={true} size="default" />
              </div>
            )}
          </div>
          <div className="mt-4 md:mt-0 space-x-2">
            <Button onClick={() => setShowChatModal(true)}>
              Message
            </Button>
            <Button
              onClick={handleFollowToggle}
              disabled={isLoading}
              variant={isFollowing ? "outline" : "default"}
            >
              {isLoading ? "Loading..." : isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>
      </div>

      <CreatorChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        creatorId={creatorId}
        creatorName={displayName}
        creatorAvatar={avatarUrl}
      />
    </>
  );
}
