
import React from 'react';
import PostCard from '@/components/PostCard';
import { Post } from '@/types';

interface FeedPostItemProps {
  post: Post;
  readPostIds?: Set<string>;
  markAsRead?: (postId: string) => void;
  creatorInfo?: any;
  onPostClick?: (post: Post) => void;
}

export function FeedPostItem({ 
  post, 
  readPostIds, 
  markAsRead, 
  creatorInfo, 
  onPostClick 
}: FeedPostItemProps) {
  const handlePostClick = () => {
    // Mark as read if function is provided
    if (markAsRead && readPostIds && !readPostIds.has(post.id)) {
      markAsRead(post.id);
    }
    
    // Call the onPostClick callback if provided
    if (onPostClick) {
      onPostClick(post);
    }
  };

  return (
    <div className="mb-6">
      <PostCard
        id={post.id}
        title={post.title}
        content={post.content}
        authorName={post.authorName || creatorInfo?.display_name || ''}
        authorAvatar={post.authorAvatar || creatorInfo?.avatar_url}
        createdAt={post.createdAt}
        date={post.date}
        tier_id={post.tier_id}
        attachments={post.attachments}
        authorId={post.authorId}
        is_nsfw={post.is_nsfw}
        onClick={handlePostClick}
      />
    </div>
  );
}
