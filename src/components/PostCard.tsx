
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatRelativeDate } from '@/utils/auth-helpers';
import { PostAttachments } from './PostAttachments';
import { PostInteractions } from './post/PostInteractions';
import { PostCardHeader } from './post/PostCardHeader';
import { PostCardMedia } from './post/PostCardMedia';
import { PostCardContent } from './post/PostCardContent';
import { TagDisplay } from './tags/TagDisplay';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import { useNSFWPreferences } from '@/hooks/useNSFWPreferences';
import { NSFWContentPlaceholder } from '@/components/nsfw/NSFWContentPlaceholder';
import { Badge } from './ui/badge';
import { Lock, Crown, Eye, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { isVideoUrl } from '@/utils/videoUtils';
import { generatePostBanner, hasMediaContent } from '@/utils/postBanners';
import { usePostViews } from '@/hooks/usePostViews';

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
  tags?: string[];
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
  date,
  tier_id,
  attachments,
  tags,
  users,
  authorId,
  is_nsfw = false
}) => {
  const { user } = useAuth();
  const { data: nsfwPrefs } = useNSFWPreferences();
  const { viewCount } = usePostViews(id);
  const parsedAttachments = attachments ? (Array.isArray(attachments) ? attachments : []) : [];
  
  // Check if this NSFW post should be hidden
  const shouldHideNSFW = is_nsfw && !nsfwPrefs?.isNSFWEnabled && user?.id !== authorId;
  
  if (shouldHideNSFW) {
    return <NSFWContentPlaceholder type="post" />;
  }
  
  
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
  } else {
    // Non-creator viewing post - use subscription logic
    hasFullAccess = !isPremiumPost || isSubscribedToTier || hasActiveSubscription;
  }
  
  // Use real metadata - avoid showing "Unknown"
  const displayAuthorName = authorName || users?.username || "Creator";
  const displayAvatar = authorAvatar || users?.profile_picture;
  const displayDate = createdAt ? formatRelativeDate(createdAt) : "Recently";

  

  // FIXED VIDEO HANDLING: Separate video URLs from video files
  const videoUrls = parsedAttachments.filter(attachment => 
    attachment.type === 'video' && isVideoUrl(attachment.url)
  );
  
  const videoFiles = parsedAttachments.filter(attachment => 
    attachment.type === 'video' && !isVideoUrl(attachment.url)
  );
  
  const nonVideoAttachments = parsedAttachments.filter(attachment => 
    attachment.type !== 'video'
  );

  // Create filtered attachments for PostCardMedia (include video URLs and non-video media)
  const mediaAttachmentsForPostCardMedia = [...videoUrls, ...nonVideoAttachments];

  // Filter and properly type attachments for PostAttachments component (include only video files and PDFs)
  const attachmentsForPostAttachments = [...videoFiles, ...parsedAttachments.filter(att => att.type === 'pdf')]
    .map(attachment => ({
      url: attachment.url,
      name: attachment.name,
      type: attachment.type as 'image' | 'video' | 'pdf',
      size: attachment.size
    }));

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

  // Check if post has media content
  const postHasMedia = hasMediaContent(attachments);

  return (
    <Card className={`w-full max-w-2xl mx-auto ${isPremiumPost && !hasFullAccess ? 'border-[#eee] bg-white' : ''}`}>
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
          
          {/* Display tags if available */}
          {tags && tags.length > 0 && (
            <TagDisplay 
              tags={tags} 
              maxTags={5} 
              size="sm" 
              className="mb-3" 
            />
          )}
          
          {/* Show gradient banner only if no media content */}
          {!postHasMedia && (
            <div 
              className="relative h-48 rounded-lg overflow-hidden"
              style={{ background: generatePostBanner(title) }}
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{title}</h3>
                  {isPremiumPost && (
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Seller's own members-only content indicator */}
          {isPremiumPost && hasFullAccess && isOwnPost && (
            <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
              <div className="flex items-center gap-2 text-[#555]">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Your members-only content</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Seller View
                </Badge>
              </div>
            </div>
          )}
          
          {/* Members-only content access indicator for subscribers */}
          {isPremiumPost && hasFullAccess && !isOwnPost && (
            <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
              <div className="flex items-center gap-2 text-[#555]">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">✓ Members-only content unlocked</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  Subscribed
                </Badge>
              </div>
            </div>
          )}
          
          {/* Members-only content lock for non-subscribers */}
          {isPremiumPost && !hasFullAccess && !isOwnPost && (
            <div className="p-4 bg-[#fafafa] border border-[#eee] rounded-lg">
              <div className="flex items-center gap-2 text-[#111] mb-3">
                <Lock className="h-5 w-5 text-primary" />
                <span className="font-semibold">Members-only content</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Subscribers only
                </Badge>
              </div>
              <p className="text-sm text-[#777] mb-3">
                This post is for this seller's subscribers. Subscribe to unlock the full post.
              </p>

              <Button className="w-full bg-primary hover:bg-[#3a7aab] text-white">
                <Lock className="h-4 w-4 mr-2" />
                Subscribe to unlock
              </Button>
            </div>
          )}
          
          {/* Show media/attachments based on access level and only if media exists */}
          {postHasMedia && hasFullAccess ? (
            <>
              {/* Show video URLs and non-video media in PostCardMedia */}
              {mediaAttachmentsForPostCardMedia.length > 0 && (
                <PostCardMedia attachments={mediaAttachmentsForPostCardMedia} />
              )}
              {/* Show video files and PDFs in PostAttachments */}
              {attachmentsForPostAttachments.length > 0 && (
                <PostAttachments attachments={attachmentsForPostAttachments} />
              )}
            </>
          ) : postHasMedia && isPremiumPost && !isOwnPost && (
            <div className="relative">
              {/* Show video URLs and non-video media in PostCardMedia for preview */}
              {mediaAttachmentsForPostCardMedia.length > 0 && (
                <PostCardMedia attachments={mediaAttachmentsForPostCardMedia} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-lg flex items-center justify-center">
                <div className="bg-black/80 rounded-full p-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Improved spacing for post metadata and interactions */}
        <div className="pt-2 border-t space-y-3">
          {/* Post type and view count with better spacing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary" 
                className={`${
                  isPremiumPost
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                {isPremiumPost ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{viewCount} views</span>
            </div>
          </div>
          
          {/* Post interactions with proper spacing */}
          <PostInteractions 
            postId={id} 
            authorId={authorId}
            postTitle={title}
            postContent={content}
            creatorName={displayAuthorName}
            creatorUsername={users?.username}
            isPublic={!isPremiumPost}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
