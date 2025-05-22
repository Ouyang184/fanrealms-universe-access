
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight } from "lucide-react";
import { ContentCard } from "@/components/content/ContentCard";

interface ContentItem {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  creator: {
    id: number;
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
}

export function ContentTabs({ forYouContent, trendingContent, recentContent, onCardClick }: ContentTabsProps) {
  const renderContent = (content: ContentItem[]) => {
    return content.map((item) => (
      <ContentCard 
        key={item.id} 
        content={item}
        onClick={onCardClick}
      />
    ));
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
