
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight } from "lucide-react";
import { ContentItem } from "@/components/explore/ContentItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@/types";

interface ContentTabsProps {
  forYouPosts: Post[];
  trendingPosts: Post[];
  recentPosts: Post[];
  onPostClick: (post: Post) => void;
  isLoading?: boolean;
}

export function ContentTabs({ forYouPosts, trendingPosts, recentPosts, onPostClick, isLoading = false }: ContentTabsProps) {
  const renderContent = (posts: Post[], type: 'trending' | 'new') => {
    if (isLoading) {
      return Array.from({ length: 8 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="bg-gray-900 border-gray-800 rounded-lg overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          </div>
        </div>
      ));
    }

    if (posts.length === 0) {
      return (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No content available yet</p>
          <p className="text-sm">Check back later for new posts from creators!</p>
        </div>
      );
    }

    return posts.map((post) => {
      console.log('ContentTabs: Rendering post with author info:', {
        postId: post.id,
        title: post.title,
        authorName: post.authorName,
        authorAvatar: post.authorAvatar,
        authorId: post.authorId
      });

      return (
        <div key={post.id} onClick={() => onPostClick(post)} className="cursor-pointer">
          <ContentItem post={post} type={type} />
        </div>
      );
    });
  };

  return (
    <Tabs defaultValue="for-you" className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="for-you" className="data-[state=active]:bg-purple-900/30">
            For You
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-purple-900/30">
            Trending
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-purple-900/30">
            Recent
          </TabsTrigger>
        </TabsList>
        <Button variant="link" className="text-purple-400">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <TabsContent value="for-you" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {renderContent(forYouPosts, 'new')}
        </div>
      </TabsContent>

      <TabsContent value="trending" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {renderContent(trendingPosts, 'trending')}
        </div>
      </TabsContent>

      <TabsContent value="recent" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {renderContent(recentPosts, 'new')}
        </div>
      </TabsContent>
    </Tabs>
  );
}
