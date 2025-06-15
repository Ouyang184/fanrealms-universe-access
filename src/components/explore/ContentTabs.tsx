
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentItem } from "./ContentItem";
import { RecommendedCreator } from "./RecommendedCreator";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/types";

interface ContentTabsProps {
  trendingPosts: Post[];
  newReleases: Post[];
  recommendedCreators: any[];
  isLoadingPosts: boolean;
  isLoadingCreators: boolean;
  onPostClick?: (post: Post) => void;
}

export function ContentTabs({ 
  trendingPosts, 
  newReleases, 
  recommendedCreators, 
  isLoadingPosts, 
  isLoadingCreators,
  onPostClick 
}: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState("trending");

  return (
    <div className="mb-16">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="new">New Releases</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-6">
          {isLoadingPosts ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingPosts.map((post) => (
                <ContentItem 
                  key={post.id} 
                  post={post} 
                  type="trending" 
                  onPostClick={onPostClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          {isLoadingPosts ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {newReleases.map((post) => (
                <ContentItem 
                  key={post.id} 
                  post={post} 
                  type="new" 
                  onPostClick={onPostClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="mt-6">
          {isLoadingCreators ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedCreators.map((creator) => (
                <RecommendedCreator key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
