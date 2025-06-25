
import React from 'react';
import PostCard from '@/components/PostCard';
import { Post } from '@/types';

interface FeedPostItemProps {
  post: Post;
}

export function FeedPostItem({ post }: FeedPostItemProps) {
  return (
    <div className="mb-6">
      <PostCard
        id={post.id}
        title={post.title}
        content={post.content}
        authorName={post.authorName || ''}
        authorAvatar={post.authorAvatar}
        createdAt={post.createdAt}
        date={post.date}
        tier_id={post.tier_id}
        attachments={post.attachments}
        authorId={post.authorId}
        is_nsfw={post.is_nsfw}
      />
    </div>
  );
}
