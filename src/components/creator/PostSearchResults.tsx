
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/PostCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/types";
import { Search } from "lucide-react";

interface PostSearchResultsProps {
  posts: Post[];
  isLoading: boolean;
  searchQuery: string;
  isCreatorStudio?: boolean;
}

export function PostSearchResults({ posts, isLoading, searchQuery, isCreatorStudio = false }: PostSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (posts.length === 0 && searchQuery) {
    return (
      <div className="text-center py-12">
        <Search className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Sorry, no posts found</h3>
        <p className="text-muted-foreground">Try searching something else!</p>
        {isCreatorStudio && (
          <Button asChild className="mt-4">
            <Link to="/creator-studio/posts">Create Your First Post</Link>
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {searchQuery && (
        <div className="mb-6">
          <p className="text-muted-foreground">
            Found {posts.length} post{posts.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        </div>
      )}
      {posts.map((post) => (
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
      ))}
    </div>
  );
}
