
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatRelativeDate } from '@/utils/auth-helpers';
import { PostAttachments } from './PostAttachments';
import { PostInteractions } from './post/PostInteractions';
import { PostCardHeader } from './post/PostCardHeader';
import { PostCardMedia } from './post/PostCardMedia';
import { PostCardContent } from './post/PostCardContent';

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
  const parsedAttachments = attachments ? (Array.isArray(attachments) ? attachments : []) : [];
  
  // Use real metadata - avoid showing "Unknown"
  const displayAuthorName = authorName || users?.username || "Creator";
  const displayAvatar = authorAvatar || users?.profile_picture;
  const displayDate = createdAt ? formatRelativeDate(createdAt) : "Recently";
  const isPremium = !!tier_id;

  console.log('PostCard - authorId:', authorId);

  return (
    <Card className="w-full">
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
          <PostCardContent title={title} content={content} />
          
          <PostCardMedia attachments={attachments} />
          
          <PostAttachments attachments={parsedAttachments} />
        </div>
        
        <PostInteractions postId={id} authorId={authorId} />
      </CardContent>
    </Card>
  );
};

export default PostCard;
