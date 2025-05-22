
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <PostCard 
          key={post.id}
          {...post}
          image={`https://picsum.photos/seed/${post.id}/800/450`}
        />
      ))}
    </div>
  );
}
