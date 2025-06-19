
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
import { useNSFWPreferences } from '@/hooks/useNSFWPreferences';
import { NSFWContentPlaceholder } from '@/components/nsfw/NSFWContentPlaceholder';
import { Badge } from './ui/badge';
import { Lock, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { isVideoUrl } from '@/utils/videoUtils';
import { generatePostBanner } from '@/utils/postBanners';

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
  is_nsfw?: boolean;
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
  authorId,
  is_nsfw = false
}) => {
  const { user } = useAuth();
  const { data: nsfwPrefs } = useNSFWPreferences();
  const parsedAttachments = attachments ? (Array.isArray(attachments) ? attachments : []) : [];
  
  // Check if this NSFW post should be hidden
  const shouldHideNSFW = is_nsfw && !nsfwPrefs?.isNSFWEnabled && user?.id !== authorId;
  
  if (shouldHideNSFW) {
    return <NSFWContentPlaceholder type="post" />;
  }
  
  // ENHANCED DEBUG: Log all the important values with more detail
  console.log('PostCard - ENHANCED DEBUG:', {
    postId: id,
    postTitle: title,
    authorId: authorId,
    authorIdType: typeof authorId,
    authorIdValue: JSON.stringify(authorId),
    userId: user?.id,
    userIdType: typeof user?.id,
    userIdValue: JSON.stringify(user?.id),
    bothDefined: !!(authorId && user?.id),
    strictStringComparison: String(authorId || '') === String(user?.id || ''),
    tier_id: tier_id
  });
  
  // Check if user is subscribed to this tier
  const { subscriptionData } = useSimpleSubscriptionCheck(tier_id || undefined, authorId);
  
  // FIXED: Ensure robust comparison - convert both to strings and handle undefined
  const isOwnPost = !!(user?.id && authorId && String(user.id) === String(authorId));
  
  // ENHANCED CREATOR ACCESS LOGIC - Apply creator-centric logic consistently
  const isPremiumPost = !!tier_id;
  const isSubscribedToTier = subscriptionData?.isSubscribed === true;
  const hasActiveSubscription = subscriptionData?.subscription?.isActive === true;
  
  // CREATOR-CENTRIC LOGIC: Creators ALWAYS have full access to their own posts
  // This matches the logic from useCreatorPosts.ts
  let hasFullAccess = false;
  
  if (isOwnPost) {
    // Creator viewing their own post - ALWAYS grant full access
    hasFullAccess = true;
    console.log('PostCard - CREATOR ACCESS OVERRIDE:', {
      postId: id,
      message: 'Creator viewing their own post - forcing full access',
      authorId,
      userId: user?.id,
      isPremiumPost
    });
  } else {
    // Non-creator viewing post - use subscription logic
    hasFullAccess = !isPremiumPost || isSubscribedToTier || hasActiveSubscription;
  }
  
  // Use real metadata - avoid showing "Unknown"
  const displayAuthorName = authorName || users?.username || "Creator";
  const displayAvatar = authorAvatar || users?.profile_picture;
  const displayDate = createdAt ? formatRelativeDate(createdAt) : "Recently";

  console.log('PostCard - ENHANCED ACCESS DECISION:', {
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
    finalDecision: hasFullAccess ? 'FULL_ACCESS_GRANTED' : 'ACCESS_RESTRICTED',
    // Additional debug info
    userObject: user,
    subscriptionDataObject: subscriptionData
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
  
  // Generate banner gradient for this post
  const bannerGradient = generatePostBanner(id);

  return (
    <Card className={`w-full overflow-hidden ${isPremiumPost && !hasFullAccess ? 'border-amber-200 bg-gradient-to-br from-amber-50/30 to-purple-50/30' : ''}`}>
      {/* Post Banner */}
      <div className={`relative h-32 ${bannerGradient}`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
            {displayContent.title}
          </h2>
        </div>
      </div>
      
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
          <PostCardContent title="" content={displayContent.content} />
          
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
              <PostAttachments attachments={parsedAttachments.filter(attachment => {
                if (attachment.type === 'video' && isVideoUrl(attachment.url)) {
                  return false; // Exclude video URLs from PostAttachments
                }
                return true; // Include all other attachments
              })} />
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
