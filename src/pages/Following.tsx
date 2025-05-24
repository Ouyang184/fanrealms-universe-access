
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, TrendingUp, Star, Heart, MessageSquare } from "lucide-react";
import { useCreators } from "@/hooks/useCreators";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CreatorProfile } from "@/types";

export default function FollowingPage() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Following | Creator Platform";
  }, []);

  const { data: creators, isLoading: loadingCreators } = useCreators();
  const { subscriptions, loadingSubscriptions } = useSubscriptions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Loading state
  if (loadingCreators || loadingSubscriptions) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  // Get followed creator IDs
  const followedCreatorIds = subscriptions?.map(sub => sub.creator_id) || [];
  
  // Filter for followed creators with real data
  const followedCreators = creators?.filter(creator => 
    followedCreatorIds.includes(creator.id)
  ) || [];

  // Get real categories from creator tags
  const allCategories = followedCreators.flatMap(creator => creator.tags || []);
  const uniqueCategories = [...new Set(allCategories)];
  const categories = ["all", ...uniqueCategories];

  // Filter creators based on search and category
  const filteredCreators = followedCreators.filter(creator => {
    const matchesSearch = creator.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || (creator.tags && creator.tags.includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  // Recommended creators (not followed) - limit to 6
  const recommendedCreators = creators?.filter(creator => 
    !followedCreatorIds.includes(creator.id)
  ).slice(0, 6) || [];

  return (
    <MainLayout>
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Following</h1>
            <p className="text-muted-foreground">
              Creators you follow and recommendations for you
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Following</p>
                    <p className="text-2xl font-bold">{followedCreators.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Followers</p>
                    <p className="text-2xl font-bold">
                      {followedCreators.reduce((sum, creator) => sum + (creator.follower_count || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Star className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">{uniqueCategories.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="following" className="space-y-6">
            <TabsList>
              <TabsTrigger value="following">Following ({followedCreators.length})</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
            </TabsList>

            {/* Following Tab */}
            <TabsContent value="following" className="space-y-6">
              {filteredCreators.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedCategory !== "all" 
                      ? "Try adjusting your search or filters"
                      : "Start following creators to see them here"
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCreators.map((creator) => (
                    <Card key={creator.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Banner */}
                        <div 
                          className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{
                            backgroundImage: creator.banner_url ? `url(${creator.banner_url})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        ></div>
                        
                        {/* Profile */}
                        <div className="px-4 pb-4">
                          <div className="flex items-start gap-3 -mt-8">
                            <Avatar className="h-16 w-16 border-4 border-white">
                              <AvatarImage src={creator.avatar_url || undefined} />
                              <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 mt-8">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">{creator.displayName}</h3>
                                {creator.tags && creator.tags.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {creator.tags[0]}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {creator.bio}
                              </p>
                              
                              {/* Stats */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{(creator.follower_count || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  <span>{Math.floor(Math.random() * 1000)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{Math.floor(Math.random() * 100)}</span>
                                </div>
                              </div>
                              
                              {/* Action Button */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => window.location.href = `/creator/${creator.username}`}
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Recommended Tab */}
            <TabsContent value="recommended" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedCreators.map((creator) => (
                  <Card key={creator.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Banner */}
                      <div 
                        className="h-24 bg-gradient-to-r from-green-500 to-blue-600"
                        style={{
                          backgroundImage: creator.banner_url ? `url(${creator.banner_url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                      
                      {/* Profile */}
                      <div className="px-4 pb-4">
                        <div className="flex items-start gap-3 -mt-8">
                          <Avatar className="h-16 w-16 border-4 border-white">
                            <AvatarImage src={creator.avatar_url || undefined} />
                            <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 mt-8">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{creator.displayName}</h3>
                              {creator.tags && creator.tags.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {creator.tags[0]}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {creator.bio}
                            </p>
                            
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{(creator.follower_count || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{Math.floor(Math.random() * 1000)}</span>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => {
                                  // Add follow logic here
                                }}
                              >
                                Follow
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/creator/${creator.username}`}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
