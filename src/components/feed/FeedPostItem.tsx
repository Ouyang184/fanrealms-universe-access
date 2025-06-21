
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, ThumbsDown, Crown, Eye } from "lucide-react";
import { useSimpleSubscriptionCheck } from "@/hooks/useSimpleSubscriptionCheck";
import { NSFWContentGate } from "@/components/nsfw/NSFWContentGate";
import { PostLikes } from "@/components/post/PostLikes";
import { PostComments } from "@/components/post/PostComments";
import { PostCardContent } from "@/components/post/PostCardContent";
import { PostCardMedia } from "@/components/post/PostCardMedia";
import { TierAccessInfo } from "./TierAccessInfo";
import { Post } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { hasMediaContent } from "@/utils/postBanners";

interface FeedPostItemProps {
  post: Post;
  readPostIds: Set<string>;
  markAsRead: (postId: string) => void;
  creatorInfo?: any;
  onPostClick?: (post: Post) => void;
}

export const FeedPostItem: React.FC<FeedPostItemProps> = ({ 
  post, 
  readPostIds, 
  markAsRead, 
  creatorInfo,
  onPostClick 
}) => {
  const { user } = useAuth();
  
  const { subscriptionData } = useSimpleSubscriptionCheck(post.tier_id || undefined, post.authorId);

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

  const getCreatorDisplayName = () => {
    if (creatorInfo?.display_name) {
      return creatorInfo.display_name;
    }
    if (creatorInfo?.username) {
      return creatorInfo.username;
    }
    if (post.authorName && post.authorName !== 'Unknown') {
      return post.authorName;
    }
    return 'Creator';
  };

  const displayName = getCreatorDisplayName();
  const avatarUrl = creatorInfo?.avatar_url || creatorInfo?.profile_image_url || post.authorAvatar || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png";

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

  // Check if post has media content
  const postHasMedia = hasMediaContent(post.attachments);

  // Check if post is read
  const isRead = readPostIds.has(post.id);

  // Handle clicking on the post to view it
  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick(post);
    } else {
      // Fallback: mark as read when clicked
      markAsRead(post.id);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={avatarUrl} 
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
          {!isRead && (
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

          {/* Post content with conditional blur and click handler */}
          <div className={hasAccess ? "cursor-pointer" : "relative cursor-pointer"} onClick={handlePostClick}>
            <PostCardContent title={post.title} content={post.content} />
            {!hasAccess && (
              <div className="absolute inset-0 backdrop-blur-sm bg-white/10 rounded-lg flex items-center justify-center">
                <div className="bg-black/80 rounded-full p-3">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
          </div>
          
          {/* Media with conditional blur - only show if media exists */}
          {postHasMedia && (
            <div className={hasAccess ? "cursor-pointer" : "relative cursor-pointer"} onClick={handlePostClick}>
              <PostCardMedia attachments={post.attachments} />
              {!hasAccess && (
                <div className="absolute inset-0 backdrop-blur-md bg-black/20 rounded-lg flex items-center justify-center">
                  <div className="bg-black/80 rounded-full p-3">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Dynamic Tier Access Information - ONLY show for non-creators */}
          {!isOwnPost && !hasAccess && <TierAccessInfo post={post} creatorInfo={creatorInfo} />}

          {/* View Full Post Button */}
          {hasAccess && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePostClick}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Full Post
              </Button>
            </div>
          )}

          {/* Engagement Section */}
          <div className="space-y-3 mt-4">
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
