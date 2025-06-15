
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/PostCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/types";

interface CreatorPostsProps {
  posts: Post[];
  isLoading?: boolean;
}

export function CreatorPosts({ posts, isLoading = false }: CreatorPostsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">This creator hasn't posted anything yet.</p>
        <p className="text-sm text-muted-foreground">
          Check back later for new content!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {posts.map((post) => {
        console.log('CreatorPosts - Post data with enhanced logging:', {
          postId: post.id,
          authorId: post.authorId,
          authorIdType: typeof post.authorId,
          authorIdValue: JSON.stringify(post.authorId),
          title: post.title,
          tier_id: post.tier_id,
          hasAuthorId: !!post.authorId
        });
        
        return (
          <PostCard 
            key={post.id}
            id={post.id}
            title={post.title}
            content={post.content}
            authorName={post.authorName || 'Unknown'}
            authorAvatar={post.authorAvatar}
            createdAt={post.createdAt}
            date={post.date || post.createdAt}
            tier_id={post.tier_id}
            attachments={post.attachments}
            authorId={post.authorId}
          />
        );
      })}
    </div>
  );
}
