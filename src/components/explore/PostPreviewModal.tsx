
import React, { useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Eye, Heart, MessageSquare, Crown, Lock } from "lucide-react";
import { Post } from "@/types";
import { PostCardMedia } from "@/components/post/PostCardMedia";
import { PostCardContent } from "@/components/post/PostCardContent";
import { PostLikes } from "@/components/post/PostLikes";
import { PostComments } from "@/components/post/PostComments";
import { ShareButton } from "@/components/post/ShareButton";
import { useSimpleSubscriptionCheck } from "@/hooks/useSimpleSubscriptionCheck";
import { useAuth } from "@/contexts/AuthContext";
import { NSFWContentGate } from "@/components/nsfw/NSFWContentGate";
import { usePostViews, usePostViewTracking } from "@/hooks/usePostViews";
import { Link } from "react-router-dom";

interface PostPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}

export function PostPreviewModal({ open, onOpenChange, post }: PostPreviewModalProps) {
  const { user } = useAuth();
  const { subscriptionData } = useSimpleSubscriptionCheck(post.tier_id || undefined, post.authorId);
  const { viewCount } = usePostViews(post.id);
  const { recordView } = usePostViewTracking();
  
  // Record view when modal opens - this is the main view tracking point
  useEffect(() => {
    if (open && post.id) {
      recordView(post.id, 'read'); // Changed from 'preview' to 'read' since clicking on content counts as viewing
    }
  }, [open, post.id, recordView]);

  const isOwnPost = user?.id === post.authorId;
  const hasAccess = isOwnPost || !post.tier_id || subscriptionData?.isSubscribed;
  
  const getDisplayContent = () => {
    if (hasAccess || !post.tier_id) {
      return {
        title: post.title,
        content: post.content,
        showFullMedia: true
      };
    } else {
      // Show preview for premium posts when not subscribed
      const previewContent = post.content.length > 150 
        ? post.content.substring(0, 150) + "..." 
        : post.content;
      
      return {
        title: post.title,
        content: previewContent,
        showFullMedia: false
      };
    }
  };

  const displayContent = getDisplayContent();
  const creatorUrl = post.authorId ? `/creator/${post.authorId}` : (post.authorName ? `/creator/${encodeURIComponent(post.authorName)}` : '#');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Link to={creatorUrl} onClick={(e) => { e.stopPropagation(); onOpenChange(false); }} aria-label={`View ${post.authorName || 'creator'} profile`} className="flex-shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.authorAvatar || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"} />
                <AvatarFallback>{post.authorName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link to={creatorUrl} onClick={(e) => { e.stopPropagation(); onOpenChange(false); }} className="font-medium hover:text-primary transition-colors">
                  {post.authorName}
                </Link>
                {post.tier_id && (
                  <Badge className="bg-primary">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {post.date}
              </div>
            </div>
          </div>
          <DialogTitle className="text-xl">{displayContent.title}</DialogTitle>
          {/* Tags under title */}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">#{tag}</Badge>
              ))}
            </div>
          )}
          <DialogDescription className="sr-only">Post preview</DialogDescription>
        </DialogHeader>

        <NSFWContentGate 
          isNSFW={post.is_nsfw} 
          authorId={post.authorId}
          type="post"
        >
          <div className="space-y-4">
            <PostCardContent title="" content={displayContent.content} />
            
            {displayContent.showFullMedia ? (
              <PostCardMedia attachments={post.attachments} />
            ) : post.tier_id && (
              <div className="relative">
                <PostCardMedia attachments={post.attachments} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-lg flex items-center justify-center">
                  <div className="bg-black/80 rounded-full p-4">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Premium content notice for non-subscribers */}
            {post.tier_id && !hasAccess && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 mb-3">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Premium Content Preview</span>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  This is a preview of premium content. Subscribe to unlock the full post and exclusive content from this creator.
                </p>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white">
                  <Lock className="h-4 w-4 mr-2" />
                  Subscribe to Unlock
                </Button>
              </div>
            )}
            

            {/* Stats */}
            <div className="flex items-center gap-6 py-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{viewCount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 border-t pt-4">
              <PostLikes postId={post.id} />
              
              <ShareButton
                postId={post.id}
                postTitle={post.title}
                postContent={post.content}
                creatorName={post.authorName || "Creator"}
                creatorUsername={post.authorName}
                isPublic={!post.tier_id}
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600"
              />
            </div>

            {/* Comments */}
            <div className="border-t pt-4">
              <PostComments postId={post.id} />
            </div>
          </div>
        </NSFWContentGate>
      </DialogContent>
    </Dialog>
  );
}
