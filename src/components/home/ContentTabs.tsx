
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight } from "lucide-react";
import { ContentItem } from "@/components/explore/ContentItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@/types";
import { Link } from "react-router-dom";

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
        <div key={`skeleton-${index}`} className="rounded-lg border border-border overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ));
    }

    if (posts.length === 0) {
      return (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <p className="text-sm">No content available yet</p>
        </div>
      );
    }

    return posts.map((post) => (
      <div key={post.id} onClick={() => onPostClick(post)} className="cursor-pointer">
        <ContentItem post={post} type={type} onPostClick={onPostClick} />
      </div>
    ));
  };

  return (
    <Tabs defaultValue="for-you" className="mb-16">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>
        <Link to="/explore">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <TabsContent value="for-you" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {renderContent(forYouPosts, 'new')}
        </div>
      </TabsContent>

      <TabsContent value="trending" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {renderContent(trendingPosts, 'trending')}
        </div>
      </TabsContent>

      <TabsContent value="recent" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {renderContent(recentPosts, 'new')}
        </div>
      </TabsContent>
    </Tabs>
  );
}
