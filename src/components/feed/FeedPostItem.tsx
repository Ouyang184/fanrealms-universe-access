
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, ThumbsDown } from "lucide-react";
import { useSimpleSubscriptionCheck } from "@/hooks/useSimpleSubscriptionCheck";
import { usePostVisibility } from "@/hooks/usePostVisibility";
import { PostLikes } from "@/components/post/PostLikes";
import { PostComments } from "@/components/post/PostComments";
import { PostCardContent } from "@/components/post/PostCardContent";
import { PostCardMedia } from "@/components/post/PostCardMedia";
import { TierAccessInfo } from "./TierAccessInfo";
import { Post } from "@/types";

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
  const postRef = usePostVisibility({
    postId: post.id,
    onPostSeen: markPostAsRead,
    threshold: 0.5,
    visibilityDuration: 2000
  });

  // Check subscription status for this post's tier
  const { subscriptionData } = useSimpleSubscriptionCheck(post.tier_id || undefined, post.authorId);
  const hasAccess = !post.tier_id || subscriptionData?.isSubscribed || false;

  // Get the proper creator name - prioritize display_name from creator info
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

  return (
    <div ref={postRef} className="bg-card border border-border rounded-lg overflow-hidden">
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
          {!readPosts.has(post.id) && (
            <Badge className="bg-blue-500 text-white">New</Badge>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
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
        
        {/* Dynamic Tier Access Information */}
        <TierAccessInfo post={post} creatorInfo={creatorInfo} />

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
    </div>
  );
};
