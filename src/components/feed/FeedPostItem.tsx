
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, ThumbsDown, Crown } from "lucide-react";
import { useSimpleSubscriptionCheck } from "@/hooks/useSimpleSubscriptionCheck";
import { usePostVisibility } from "@/hooks/usePostVisibility";
import { NSFWContentGate } from "@/components/nsfw/NSFWContentGate";
import { PostLikes } from "@/components/post/PostLikes";
import { PostComments } from "@/components/post/PostComments";
import { PostCardContent } from "@/components/post/PostCardContent";
import { PostCardMedia } from "@/components/post/PostCardMedia";
import { TierAccessInfo } from "./TierAccessInfo";
import { Post } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface FeedPostItemProps {
  post: Post;
  readPosts: Set<string>;
  markPostAsRead: (postId: string) => void;
  creatorInfo?: any;
}

export const FeedPostItem: React.FC<FeedPostItemProps> = ({ 
  post, 
  readPosts, 
  markPostAsRead, 
  creatorInfo 
}) => {
  const { user } = useAuth();
  
  const { subscriptionData } = useSimpleSubscriptionCheck(post.tier_id || undefined, post.authorId);
  
  const postRef = usePostVisibility({
    postId: post.id,
    onPostSeen: markPostAsRead,
    threshold: 0.5,
    visibilityDuration: 2000
  });

  const isOwnPost = user?.id === post.authorId;
  
  let hasAccess = false;
  
  if (isOwnPost) {
    hasAccess = true;
    console.log('FeedPostItem - CREATOR ACCESS OVERRIDE:', {
      postId: post.id,
      message: 'Creator viewing their own post - forcing full access',
      authorId: post.authorId,
      userId: user?.id,
      tierId: post.tier_id
    });
  } else {
    hasAccess = !post.tier_id || subscriptionData?.isSubscribed || false;
  }

  // Improved creator display logic - prioritize creatorInfo data
  const getCreatorDisplayName = () => {
    // First try display_name from creator info
    if (creatorInfo?.display_name) {
      return creatorInfo.display_name;
    }
    // Then try username from creator info
    if (creatorInfo?.username) {
      return creatorInfo.username;
    }
    // Fall back to post's authorName if it's not "Unknown"
    if (post.authorName && post.authorName !== 'Unknown') {
      return post.authorName;
    }
    // Final fallback
    return 'Creator';
  };

  // Improved avatar logic - prioritize creatorInfo data
  const getCreatorAvatar = () => {
    // First try profile_image_url from creator info
    if (creatorInfo?.profile_image_url) {
      return creatorInfo.profile_image_url;
    }
    // Then try avatar_url from creator info
    if (creatorInfo?.avatar_url) {
      return creatorInfo.avatar_url;
    }
    // Fall back to post's authorAvatar
    if (post.authorAvatar) {
      return post.authorAvatar;
    }
    // No avatar available
    return null;
  };

  const displayName = getCreatorDisplayName();
  const avatarUrl = getCreatorAvatar();

  console.log('FeedPostItem - Creator display info:', {
    postId: post.id,
    creatorInfo,
    displayName,
    avatarUrl,
    postAuthorName: post.authorName,
    postAuthorAvatar: post.authorAvatar
  });

  console.log('FeedPostItem - Creator access check:', {
    postId: post.id,
    postTitle: post.title,
    tierId: post.tier_id,
    authorId: post.authorId,
    userId: user?.id,
    isOwnPost,
    hasAccess,
    subscriptionData,
    finalDecision: hasAccess ? 'FULL_ACCESS_GRANTED' : 'ACCESS_RESTRICTED'
  });

  return (
    <div ref={postRef} className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={avatarUrl || undefined} 
              alt={displayName} 
            />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-primary">{displayName}</h3>
              <span className="text-sm text-muted-foreground">{post.date}</span>
            </div>
          </div>
          {!readPosts.has(post.id) && (
            <Badge className="bg-blue-500 text-white">New</Badge>
          )}
        </div>
      </div>

      {/* Post Content with NSFW Gate */}
      <NSFWContentGate 
        isNSFW={post.is_nsfw} 
        authorId={post.authorId}
        type="post"
      >
        <div className="p-4">
          {/* Creator's own premium content indicator */}
          {post.tier_id && hasAccess && isOwnPost && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Crown className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Your Premium Content</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Creator View
                </Badge>
              </div>
            </div>
          )}

          {/* Post content with conditional blur */}
          <div className={hasAccess ? "" : "relative"}>
            <PostCardContent title={post.title} content={post.content} />
            {!hasAccess && (
              <div className="absolute inset-0 backdrop-blur-sm bg-white/10 rounded-lg"></div>
            )}
          </div>
          
          {/* Media with conditional blur */}
          <div className={hasAccess ? "" : "relative"}>
            <PostCardMedia attachments={post.attachments} />
            {!hasAccess && post.attachments && (
              <div className="absolute inset-0 backdrop-blur-md bg-black/20 rounded-lg flex items-center justify-center">
                <div className="bg-black/80 rounded-full p-3">
                  <Lock className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
          </div>
          
          {/* Dynamic Tier Access Information - ONLY show for non-creators */}
          {!isOwnPost && !hasAccess && <TierAccessInfo post={post} creatorInfo={creatorInfo} />}

          {/* Engagement Section */}
          <div className="space-y-3">
            {/* Like/Dislike Bar with real data */}
            <div className="flex items-center gap-4 py-2">
              <PostLikes postId={post.id} />
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
              >
                <ThumbsDown className="h-4 w-4" />
                <span className="text-sm">Dislike</span>
              </Button>
            </div>

            {/* Comments Section with real data */}
            <div className="border-t pt-3">
              <PostComments postId={post.id} />
            </div>
          </div>
        </div>
      </NSFWContentGate>
    </div>
  );
};
