
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentItem } from "./ContentItem";
import { RecommendedCreator } from "./RecommendedCreator";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Palette } from "lucide-react";
import { Link } from "react-router-dom";

interface CommissionType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  estimated_turnaround_days: number;
  sample_art_url?: string;
  creator: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    user_id: string;
  };
}

interface ContentTabsProps {
  trendingPosts: Post[];
  newReleases: Post[];
  recommendedCreators: any[];
  commissions?: CommissionType[];
  isLoadingPosts: boolean;
  isLoadingCreators: boolean;
  isLoadingCommissions?: boolean;
  onPostClick?: (post: Post) => void;
  defaultTab?: string;
}

export function ContentTabs({ 
  trendingPosts, 
  newReleases, 
  recommendedCreators, 
  commissions = [],
  isLoadingPosts, 
  isLoadingCreators,
  isLoadingCommissions = false,
  onPostClick,
  defaultTab = "trending"
}: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  return (
    <div className="mb-16">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile-optimized tab list */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger 
            value="trending" 
            className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-background"
          >
            Trending
          </TabsTrigger>
          <TabsTrigger 
            value="new" 
            className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-background"
          >
            New
          </TabsTrigger>
          <TabsTrigger 
            value="recommended" 
            className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-background"
          >
            Creators
          </TabsTrigger>
          <TabsTrigger 
            value="commissions" 
            className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-background"
          >
            Commissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-4 sm:mt-6">
          {isLoadingPosts ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
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

        <TabsContent value="new" className="mt-4 sm:mt-6">
          {isLoadingPosts ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
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

        <TabsContent value="recommended" className="mt-4 sm:mt-6">
          {isLoadingCreators ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {recommendedCreators.map((creator) => (
                <RecommendedCreator key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commissions" className="mt-4 sm:mt-6">
          {isLoadingCommissions ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {commissions.map((commission) => (
                <Card key={commission.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader className="pb-3 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {commission.creator.profile_image_url ? (
                          <img
                            src={commission.creator.profile_image_url}
                            alt={commission.creator.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Palette className="h-3 w-3 sm:h-5 sm:w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">{commission.creator.display_name}</p>
                        <Badge variant="secondary" className="text-xs scale-75 sm:scale-100 origin-left">
                          Creator
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-sm sm:text-lg line-clamp-2">{commission.name}</CardTitle>
                    {commission.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {commission.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 pt-0">
                    {/* Sample Art - Mobile optimized */}
                    {commission.sample_art_url ? (
                      <div className="relative">
                        <img
                          src={commission.sample_art_url}
                          alt={`Sample art for ${commission.name}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                          <Badge className="bg-black/70 text-white border-0 text-xs scale-75 sm:scale-100">
                            Sample
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-24 sm:h-32 bg-muted rounded-lg border flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Palette className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
                          <p className="text-xs sm:text-sm">No sample</p>
                        </div>
                      </div>
                    )}

                    {/* Commission Details - Mobile optimized grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                        <span className="font-medium truncate">${commission.base_price}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{commission.estimated_turnaround_days}d</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link to={`/creator/${commission.creator.id}?tab=commissions`}>
                      <Button className="w-full text-xs sm:text-sm py-2" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
