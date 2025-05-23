
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight } from "lucide-react";
import { ContentCard } from "@/components/content/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentItem {
  id: string | number;
  title: string;
  description: string;
  thumbnail: string;
  creator: {
    id: string | number;
    name: string;
    avatar: string;
  };
  type: string;
  date: string;
  preview: boolean;
}

interface ContentTabsProps {
  forYouContent: ContentItem[];
  trendingContent: ContentItem[];
  recentContent: ContentItem[];
  onCardClick: (content: ContentItem) => void;
  isLoading?: boolean;
}

export function ContentTabs({ forYouContent, trendingContent, recentContent, onCardClick, isLoading = false }: ContentTabsProps) {
  const renderContent = (content: ContentItem[]) => {
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

    return content.length > 0 ? (
      content.map((item) => (
        <ContentCard 
          key={item.id} 
          content={{
            id: typeof item.id === 'string' ? parseInt(item.id, 10) || 0 : item.id,
            title: item.title,
            thumbnail: item.thumbnail,
            creator: {
              name: item.creator.name,
              avatar: item.creator.avatar
            },
            type: item.type,
            date: item.date,
            preview: item.preview
          }}
          onClick={onCardClick}
        />
      ))
    ) : (
      <div className="col-span-full text-center py-8 text-muted-foreground">
        No content available
      </div>
    );
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
          {renderContent(forYouContent)}
        </div>
      </TabsContent>

      <TabsContent value="trending" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {renderContent(trendingContent)}
        </div>
      </TabsContent>

      <TabsContent value="recent" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {renderContent(recentContent)}
        </div>
      </TabsContent>
    </Tabs>
  );
}
