
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatRelativeDate } from '@/utils/auth-helpers';
import { PostAttachments } from './PostAttachments';
import { PostInteractions } from './post/PostInteractions';
import { PostCardHeader } from './post/PostCardHeader';
import { PostCardMedia } from './post/PostCardMedia';
import { PostCardContent } from './post/PostCardContent';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import { Lock, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { isVideoUrl } from '@/utils/videoUtils';

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  date: string;
  tier_id?: string | null;
  attachments?: any;
  users?: {
    username?: string;
    profile_picture?: string;
  };
  authorId: string;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  title,
  content,
  authorName,
  authorAvatar,
  createdAt,
  tier_id,
  attachments,
  users,
  authorId
}) => {
  const { user } = useAuth();
  const parsedAttachments = attachments ? (Array.isArray(attachments) ? attachments : []) : [];
  
  // Check if user is subscribed to this tier
  const { subscriptionData } = useSimpleSubscriptionCheck(tier_id || undefined, authorId);
  
  // FIXED: Check if this is the author's own post using authorId
  const isOwnPost = user?.id === authorId;
  
  // CREATOR ACCESS LOGIC - Creators always have full access to their own posts
  const isPremiumPost = !!tier_id;
  const isSubscribedToTier = subscriptionData?.isSubscribed === true;
  const hasActiveSubscription = subscriptionData?.subscription?.isActive === true;
  
  // User has full access if:
  // 1. It's not a premium post (public post)
  // 2. It's their own post (CREATOR CAN ALWAYS SEE THEIR OWN POSTS)
  // 3. They have an active subscription to the tier
  const hasFullAccess = !isPremiumPost || isOwnPost || isSubscribedToTier || hasActiveSubscription;
  
  // Use real metadata - avoid showing "Unknown"
  const displayAuthorName = authorName || users?.username || "Creator";
  const displayAvatar = authorAvatar || users?.profile_picture;
  const displayDate = createdAt ? formatRelativeDate(createdAt) : "Recently";

  console.log('PostCard - Creator access check:', {
    postId: id,
    postTitle: title,
    tierId: tier_id,
    authorId,
    userId: user?.id,
    isPremiumPost,
    isOwnPost,
    isSubscribedToTier,
    hasActiveSubscription,
    hasFullAccess,
    finalDecision: hasFullAccess ? 'FULL_ACCESS_GRANTED' : 'ACCESS_RESTRICTED'
  });

  // Check if PostCardMedia will handle video rendering
  const hasVideoAttachmentForMedia = parsedAttachments.some(attachment => 
    attachment.type === 'video' && isVideoUrl(attachment.url)
  );

  // Filter out video attachments that will be handled by PostCardMedia
  const attachmentsForPostAttachments = parsedAttachments.filter(attachment => {
    if (attachment.type === 'video' && isVideoUrl(attachment.url)) {
      return false; // Exclude video URLs from PostAttachments
    }
    return true; // Include all other attachments
  });

  // Content display logic
  const getDisplayContent = () => {
    if (hasFullAccess) {
      return {
        title: title,
        content: content,
        showFullMedia: true
      };
    } else {
      // Show preview for premium posts when not subscribed
      const previewContent = content.length > 150 
        ? content.substring(0, 150) + "..." 
        : content;
      
      return {
        title: title,
        content: previewContent,
        showFullMedia: false
      };
    }
  };

  const displayContent = getDisplayContent();

  return (
    <Card className={`w-full ${isPremiumPost && !hasFullAccess ? 'border-amber-200 bg-gradient-to-br from-amber-50/30 to-purple-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <PostCardHeader
          authorName={displayAuthorName}
          authorAvatar={displayAvatar}
          displayDate={displayDate}
          isPremium={isPremiumPost}
          users={users}
        />
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-3">
          <PostCardContent title={displayContent.title} content={displayContent.content} />
          
          {/* Creator's own premium content indicator */}
          {isPremiumPost && hasFullAccess && isOwnPost && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Crown className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Your Premium Content</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Creator View
                </Badge>
              </div>
            </div>
          )}
          
          {/* Premium content access indicator for subscribers */}
          {isPremiumPost && hasFullAccess && !isOwnPost && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Crown className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">✓ Premium Content Unlocked</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Subscribed
                </Badge>
              </div>
            </div>
          )}
          
          {/* Premium content preview/lock indicator for non-subscribers - ONLY for non-creators */}
          {isPremiumPost && !hasFullAccess && !isOwnPost && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 mb-3">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Premium Content</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  Tier Exclusive
                </Badge>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                This content is available to premium subscribers. Subscribe to unlock the full post and exclusive content from this creator.
              </p>
              
              <Button className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white">
                <Lock className="h-4 w-4 mr-2" />
                Subscribe to Unlock
              </Button>
            </div>
          )}
          
          {/* Show media/attachments based on access level */}
          {hasFullAccess ? (
            <>
              <PostCardMedia attachments={attachments} />
              <PostAttachments attachments={attachmentsForPostAttachments} />
            </>
          ) : isPremiumPost && !isOwnPost && (
            <div className="relative">
              <PostCardMedia attachments={attachments} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-lg flex items-center justify-center">
                <div className="bg-black/80 rounded-full p-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <PostInteractions postId={id} authorId={authorId} />
      </CardContent>
    </Card>
  );
};

export default PostCard;
