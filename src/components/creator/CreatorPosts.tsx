
import React from "react";
import PostCard from "@/components/PostCard";
import { Post } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Lock, Globe, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CreatorPostsProps {
  posts: Post[];
}

export function CreatorPosts({ posts }: CreatorPostsProps) {
  const { user } = useAuth();

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet from this creator.</p>
        <p className="text-sm text-muted-foreground mt-2">Follow them to be notified when they publish new content!</p>
      </div>
    );
  }

  // NEW: Show ALL posts, but organize them by access level
  const publicPosts = posts.filter(post => !post.tier_id);
  const premiumPosts = posts.filter(post => post.tier_id);

  console.log('CreatorPosts - All posts visible:', {
    totalPosts: posts.length,
    publicPosts: publicPosts.length,
    premiumPosts: premiumPosts.length,
    userId: user?.id
  });

  return (
    <div className="space-y-8">
      {/* Public Posts Section */}
      {publicPosts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Public Posts</h3>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Free
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publicPosts.map((post) => (
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
        </div>
      )}

      {/* Premium Posts Section - NOW VISIBLE TO ALL */}
      {premiumPosts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Premium Content</h3>
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-50 to-amber-50 text-purple-700 border-purple-200">
              <Lock className="h-3 w-3 mr-1" />
              Subscription Required
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {premiumPosts.map((post) => (
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
        </div>
      )}
    </div>
  );
}
