
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/PostCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/types";
import { PostSearchBar } from "./PostSearchBar";
import { PostSearchResults } from "./PostSearchResults";

interface CreatorPostsProps {
  posts: Post[];
  isLoading?: boolean;
}

export function CreatorPosts({ posts, isLoading = false }: CreatorPostsProps) {
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
        <p className="text-muted-foreground mb-4">This creator hasn't posted anything yet.</p>
        <p className="text-sm text-muted-foreground">
          Check back later for new content!
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <PostSearchBar onSearch={setSearchQuery} />
      <PostSearchResults 
        posts={filteredPosts}
        isLoading={isLoading}
        searchQuery={searchQuery}
        isCreatorStudio={false}
      />
    </div>
  );
}
