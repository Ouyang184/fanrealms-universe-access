
import React from "react";
import { HeroSection } from "./HeroSection";
import { FeaturedCreators } from "./FeaturedCreators";
import { CategoriesSection } from "./CategoriesSection";
import { HowItWorks } from "./HowItWorks";
import { HomeFooter } from "./HomeFooter";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeContent() {
  const { data: posts = [], isLoading } = usePosts();

  // Filter posts to only show published posts and scheduled posts that have reached their time
  const visiblePosts = posts.filter(post => {
    // For now, since we don't have status in the Post type, we assume all posts from usePosts are visible
    // The filtering is already done in usePosts hook
    return true;
  });

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturedCreators />
      
      {/* Recent Posts Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Latest Posts</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : visiblePosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePosts.slice(0, 6).map((post) => (
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
                  is_nsfw={post.is_nsfw}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No posts available yet.</p>
            </div>
          )}
        </div>
      </section>
      
      <CategoriesSection />
      <HowItWorks />
      <HomeFooter />
    </div>
  );
}
