
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/types";
import { PostSearchBar } from "@/components/creator/PostSearchBar";
import { PostSearchResults } from "@/components/creator/PostSearchResults";

interface ProfilePostsTabProps {
  posts: Post[];
  isLoading: boolean;
}

export function ProfilePostsTab({ posts, isLoading }: ProfilePostsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return posts;
    }
    
    const query = searchQuery.toLowerCase();
    return posts.filter(post => {
      // Search in title
      const titleMatch = post.title?.toLowerCase().includes(query);
      
      // Search in tags (if they exist)
      const tagsMatch = post.tags?.some(tag => 
        tag.toLowerCase().includes(query)
      );
      
      return titleMatch || tagsMatch;
    });
  }, [posts, searchQuery]);

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
    <div>
      <PostSearchBar onSearch={setSearchQuery} placeholder="Search your posts by title or tags..." />
      
      {/* Use PostCard components directly for proper media handling */}
      <div className="space-y-6 mt-6">
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={{
              ...post,
              comment_count: post.comment_count || 0
            }}
          />
        ))}
        
        {filteredPosts.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts match your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
