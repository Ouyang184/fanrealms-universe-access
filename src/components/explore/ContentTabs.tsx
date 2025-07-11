
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="new">New Releases</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
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

        <TabsContent value="commissions" className="mt-6">
          {isLoadingCommissions ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {commissions.map((commission) => (
                <Card key={commission.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {commission.creator.profile_image_url ? (
                          <img
                            src={commission.creator.profile_image_url}
                            alt={commission.creator.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Palette className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{commission.creator.display_name}</p>
                        <Badge variant="secondary" className="text-xs">
                          Creator
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{commission.name}</CardTitle>
                    {commission.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {commission.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sample Art */}
                    {commission.sample_art_url ? (
                      <div className="relative">
                        <img
                          src={commission.sample_art_url}
                          alt={`Sample art for ${commission.name}`}
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black/70 text-white border-0 text-xs">
                            Sample
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Palette className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm">No sample available</p>
                        </div>
                      </div>
                    )}

                    {/* Commission Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">${commission.base_price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{commission.estimated_turnaround_days} days</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link to={`/creator/${commission.creator.id}?tab=commissions`}>
                      <Button className="w-full" size="sm">
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
