
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/PostCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/types";

interface ProfilePostsTabProps {
  posts: Post[];
  isLoading: boolean;
}

export function ProfilePostsTab({ posts, isLoading }: ProfilePostsTabProps) {
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
        <p className="text-muted-foreground mb-4">You haven't created any posts yet.</p>
        <Button asChild>
          <Link to="/creator-studio/posts">Create Your First Post</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {posts.map((post) => {
        console.log('ProfilePostsTab - Post data with enhanced logging:', {
          postId: post.id,
          authorId: post.authorId,
          authorIdType: typeof post.authorId,
          authorIdValue: JSON.stringify(post.authorId),
          title: post.title,
          tier_id: post.tier_id,
          hasAuthorId: !!post.authorId,
          message: 'Creator Studio profile post with proper authorId mapping'
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
