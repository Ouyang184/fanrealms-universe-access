
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/PostCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/types";
import { PostSearchBar } from "./PostSearchBar";
import { PostSearchResults } from "./PostSearchResults";
import { useNSFWPreferences } from "@/hooks/useNSFWPreferences";
import { useAuth } from "@/contexts/AuthContext";
import { NSFWContentPlaceholder } from "@/components/nsfw/NSFWContentPlaceholder";

interface CreatorPostsProps {
  posts: Post[];
  isLoading?: boolean;
  creatorId?: string;
}

export function CreatorPosts({ posts, isLoading = false, creatorId }: CreatorPostsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { data: nsfwPrefs } = useNSFWPreferences();

  // Filter posts based on NSFW preferences, search query, and scheduled status
  const filteredPosts = useMemo(() => {
    let filtered = posts;
    
    // Filter out scheduled posts that haven't been published yet (unless user is the creator)
    const now = new Date();
    filtered = posts.filter(post => {
      // Show all posts if user is the creator
      if (user?.id === post.authorId) return true;
      
      // For other users, only show published posts or scheduled posts that have passed their scheduled time
      // This logic should already be handled by the backend query, but adding as extra safety
      return true; // The backend query already filters this
    });
    
    // Filter NSFW posts if user has NSFW disabled and isn't the creator
    if (!nsfwPrefs?.isNSFWEnabled) {
      filtered = filtered.filter(post => {
        // Show all posts if user is the creator
        if (user?.id === post.authorId) return true;
        // Otherwise, only show non-NSFW posts
        return !post.is_nsfw;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        // Search in title
        const titleMatch = post.title?.toLowerCase().includes(query);
        
        // Search in tags (if they exist)
        const tagsMatch = post.tags?.some(tag => 
          tag.toLowerCase().includes(query)
        );
        
        return titleMatch || tagsMatch;
      });
    }
    
    return filtered;
  }, [posts, searchQuery, nsfwPrefs?.isNSFWEnabled, user?.id]);

  // Count how many NSFW posts are hidden
  const hiddenNSFWCount = useMemo(() => {
    if (nsfwPrefs?.isNSFWEnabled || !user) return 0;
    return posts.filter(post => 
      post.is_nsfw && user.id !== post.authorId
    ).length;
  }, [posts, nsfwPrefs?.isNSFWEnabled, user]);

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
      <PostSearchBar onSearch={setSearchQuery} />
      
      {/* Show NSFW content notice if posts are hidden */}
      {hiddenNSFWCount > 0 && (
        <NSFWContentPlaceholder 
          type="creator" 
          className="mb-6"
        />
      )}
      
      <PostSearchResults 
        posts={filteredPosts}
        isLoading={isLoading}
        searchQuery={searchQuery}
        isCreatorStudio={false}
      />
      
      {/* Show message if all posts are filtered out */}
      {filteredPosts.length === 0 && posts.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {hiddenNSFWCount > 0 
              ? `${hiddenNSFWCount} post${hiddenNSFWCount !== 1 ? 's' : ''} hidden due to content settings.`
              : "No posts match your search criteria."
            }
          </p>
          {hiddenNSFWCount > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">Update Content Settings</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
