
import React, { useEffect, useRef } from 'react';
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
  const itemRef = useRef<HTMLDivElement>(null);

  // Auto-mark as read when 50% of the card is visible
  useEffect(() => {
    if (!itemRef.current || !markAsRead || !readPostIds) return;
    if (readPostIds.has(post.id)) return;

    const node = itemRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          markAsRead(post.id);
          observer.unobserve(entry.target);
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [post.id, markAsRead, readPostIds]);

  const handlePostClick = () => {
    // Only handle preview/navigation; read is handled by IntersectionObserver
    if (onPostClick) {
      onPostClick(post);
    }
  };

  return (
    <div ref={itemRef} className="w-full max-w-full overflow-hidden" onClick={handlePostClick}>
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
        tags={post.tags}
        authorId={post.authorId}
        is_nsfw={post.is_nsfw}
      />
    </div>
  );
}
