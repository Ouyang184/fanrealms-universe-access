
import React from "react";
import PostCard from "@/components/PostCard";
import { Post } from "@/types";

interface CreatorPostsProps {
  posts: Post[];
}

export function CreatorPosts({ posts }: CreatorPostsProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet from this creator.</p>
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
