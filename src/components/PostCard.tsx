
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
import { Lock } from 'lucide-react';

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
  const isSubscribed = subscriptionData?.isSubscribed || false;
  
  // Check if this is the author's own post
  const isOwnPost = user?.id === authorId;
  
  // Determine if user can view the full content
  const canViewContent = !tier_id || isOwnPost || isSubscribed;
  
  // Use real metadata - avoid showing "Unknown"
  const displayAuthorName = authorName || users?.username || "Creator";
  const displayAvatar = authorAvatar || users?.profile_picture;
  const displayDate = createdAt ? formatRelativeDate(createdAt) : "Recently";
  const isPremium = !!tier_id;

  console.log('PostCard - Subscription check:', {
    postId: id,
    tierId: tier_id,
    authorId,
    userId: user?.id,
    isSubscribed,
    isOwnPost,
    canViewContent
  });

  // Show locked content preview for premium posts user can't access
  const displayTitle = canViewContent ? title : `🔒 ${title}`;
  const displayContent = canViewContent ? content : "This content is available to premium subscribers only. Subscribe to unlock access.";

  return (
    <Card className={`w-full ${!canViewContent ? 'border-amber-200 bg-amber-50/20' : ''}`}>
      <CardHeader className="pb-3">
        <PostCardHeader
          authorName={displayAuthorName}
          authorAvatar={displayAvatar}
          displayDate={displayDate}
          isPremium={isPremium}
          users={users}
        />
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-3">
          <PostCardContent title={displayTitle} content={displayContent} />
          
          {!canViewContent && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 mb-2">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Premium Content</span>
              </div>
              <p className="text-sm text-amber-700">
                This post is available to premium subscribers. Subscribe to unlock full access to this creator's content.
              </p>
            </div>
          )}
          
          {canViewContent && (
            <>
              <PostCardMedia attachments={attachments} />
              <PostAttachments attachments={parsedAttachments} />
            </>
          )}
        </div>
        
        <PostInteractions postId={id} authorId={authorId} />
      </CardContent>
    </Card>
  );
};

export default PostCard;
