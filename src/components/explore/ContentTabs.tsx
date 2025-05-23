
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Zap, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentItem } from "./ContentItem";
import { RecommendedCreator } from "./RecommendedCreator";
import { Post, CreatorProfile } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ContentTabsProps {
  trendingPosts: Post[];
  newReleases: Post[];
  recommendedCreators: CreatorProfile[];
  isLoadingPosts: boolean;
  isLoadingCreators: boolean;
}

export function ContentTabs({
  trendingPosts,
  newReleases,
  recommendedCreators,
  isLoadingPosts,
  isLoadingCreators
}: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState("trending");

  return (
    <section className="mb-10">
      <Tabs defaultValue="trending" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="trending" className="data-[state=active]:bg-purple-900/30">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-purple-900/30">
              <Clock className="h-4 w-4 mr-2" />
              New Releases
            </TabsTrigger>
            <TabsTrigger value="recommended" className="data-[state=active]:bg-purple-900/30">
              <Zap className="h-4 w-4 mr-2" />
              Recommended
            </TabsTrigger>
          </TabsList>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
              <DropdownMenuItem>Most Popular</DropdownMenuItem>
              <DropdownMenuItem>Newest First</DropdownMenuItem>
              <DropdownMenuItem>Highest Rated</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem>Free Content</DropdownMenuItem>
              <DropdownMenuItem>Premium Content</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="trending" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingPosts ? (
              // Loading skeletons for trending content
              Array(4).fill(0).map((_, i) => (
                <Card key={`trending-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-5 w-4/5" />
                    <div className="flex items-center gap-3 mt-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </CardFooter>
                </Card>
              ))
            ) : trendingPosts.length > 0 ? (
              trendingPosts.map((post) => (
                <ContentItem key={post.id} post={post} type="trending" />
              ))
            ) : (
              <div className="col-span-4 text-center py-10 text-gray-400">
                No trending content found.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingPosts ? (
              // Loading skeletons for new releases
              Array(4).fill(0).map((_, i) => (
                <Card key={`new-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-5 w-4/5" />
                    <div className="flex items-center gap-3 mt-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </CardFooter>
                </Card>
              ))
            ) : newReleases.length > 0 ? (
              newReleases.map((post) => (
                <ContentItem key={post.id} post={post} type="new" />
              ))
            ) : (
              <div className="col-span-4 text-center py-10 text-gray-400">
                No new releases found.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommended" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingCreators ? (
              // Loading skeletons for recommended creators
              Array(4).fill(0).map((_, i) => (
                <Card key={`rec-skeleton-${i}`} className="bg-gray-900 border-gray-800 flex overflow-hidden">
                  <div className="p-4 flex-shrink-0">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full mt-2" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </Card>
              ))
            ) : recommendedCreators.length > 0 ? (
              recommendedCreators.map((creator) => (
                <RecommendedCreator key={creator.id} creator={creator} />
              ))
            ) : (
              <div className="col-span-2 text-center py-10 text-gray-400">
                No recommended creators found.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
