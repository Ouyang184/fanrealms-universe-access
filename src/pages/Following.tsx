
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Users, 
  TrendingUp, 
  Heart, 
  MessageSquare,
  MoreHorizontal 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreators } from "@/hooks/useCreators";
import { useFollows } from "@/hooks/useFollows";
import { useFollow } from "@/hooks/useFollow";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CreatorProfile } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function FollowingPage() {
  const { user } = useAuth();
  
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Following | Creator Platform";
  }, []);

  const { data: allCreators, isLoading: loadingCreators, refetch: refetchCreators } = useCreators();
  const { data: followedCreators = [], isLoading: loadingFollows, refetch: refetchFollows } = useFollows();
  const { unfollowCreator, followCreator } = useFollow();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Refetch data when component mounts to ensure fresh data
  useEffect(() => {
    refetchCreators();
    refetchFollows();
  }, [refetchCreators, refetchFollows]);

  // Loading state
  if (loadingCreators || loadingFollows) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  // Get real categories from creator tags
  const allCategories = followedCreators.flatMap(creator => creator.tags || []);
  const uniqueCategories = [...new Set(allCategories)];
  const categories = ["all", ...uniqueCategories];

  // Filter creators based on search and category
  const filteredCreators = followedCreators.filter(creator => {
    const displayName = creator.display_name || creator.username || 'Creator';
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (creator.bio || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || (creator.tags && creator.tags.includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  // Get followed creator IDs for proper filtering - using the actual creator IDs from the followed list
  const followedCreatorIds = new Set(followedCreators.map(creator => creator.id));
  
  // Recommended creators - exclude already followed creators and the current user's own creator profile
  const recommendedCreators = allCreators?.filter(creator => {
    // Exclude if already in followed creators list
    if (followedCreatorIds.has(creator.id)) {
      return false;
    }
    // Exclude the current user's own creator profile
    if (creator.user_id === user?.id) {
      return false;
    }
    // Also check by user_id as backup in case IDs don't match perfectly
    const isFollowedByUserId = followedCreators.some(followed => 
      followed.user_id === creator.user_id || followed.id === creator.user_id
    );
    return !isFollowedByUserId;
  }).slice(0, 6) || [];

  // Calculate total followers count from followed creators
  const totalFollowersCount = followedCreators.reduce((sum, creator) => 
    sum + (creator.follower_count || 0), 0
  );

  const handleUnfollow = async (creatorId: string) => {
    try {
      await unfollowCreator(creatorId);
      // Force refresh the data after unfollowing
      await Promise.all([
        refetchCreators(),
        refetchFollows()
      ]);
    } catch (error) {
      console.error('Error unfollowing creator:', error);
    }
  };

  const handleFollow = async (creatorId: string) => {
    try {
      await followCreator(creatorId);
      // Force refresh the data after following
      await Promise.all([
        refetchCreators(),
        refetchFollows()
      ]);
    } catch (error) {
      console.error('Error following creator:', error);
    }
  };

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
                      {totalFollowersCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
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
              <TabsTrigger value="recommended">Recommended ({recommendedCreators.length})</TabsTrigger>
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
                  {filteredCreators.map((creator) => {
                    const displayName = creator.display_name || creator.username || 'Creator';
                    return (
                      <Card key={creator.id} className="overflow-hidden bg-card border">
                        <CardContent className="p-0">
                          {/* Banner - consistent with site design */}
                          <div 
                            className="h-20 bg-gradient-to-r from-primary/20 to-primary/10"
                            style={{
                              backgroundImage: creator.banner_url ? `url(${creator.banner_url})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                          
                          {/* Profile Section */}
                          <div className="px-4 pb-4">
                            <div className="flex items-start justify-between -mt-8">
                              <Avatar className="h-16 w-16 border-4 border-background">
                                <AvatarImage src={creator.avatar_url || creator.profile_image_url || undefined} />
                                <AvatarFallback className="bg-muted text-lg font-semibold">
                                  {displayName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="mt-8 h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => window.location.href = `/creator/${creator.username || creator.id}`}
                                  >
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Notification Settings
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleUnfollow(creator.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Unfollow
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {/* Creator Info */}
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{displayName}</h3>
                                {creator.tags && creator.tags.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {creator.tags[0]}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {creator.bio || "Creator on the platform"}
                              </p>
                              
                              {/* Metrics */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => window.location.href = `/creator/${creator.username || creator.id}`}
                                >
                                  View Content
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Recommended Tab */}
            <TabsContent value="recommended" className="space-y-6">
              {recommendedCreators.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recommendations available</h3>
                  <p className="text-muted-foreground">
                    You're already following all available creators or there are no other creators on the platform yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedCreators.map((creator) => {
                    const displayName = creator.display_name || creator.username || 'Creator';
                    return (
                      <Card key={creator.id} className="overflow-hidden bg-card border">
                        <CardContent className="p-0">
                          {/* Banner */}
                          <div 
                            className="h-20 bg-gradient-to-r from-secondary/20 to-secondary/10"
                            style={{
                              backgroundImage: creator.banner_url ? `url(${creator.banner_url})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                          
                          {/* Profile Section */}
                          <div className="px-4 pb-4">
                            <div className="flex items-start -mt-8">
                              <Avatar className="h-16 w-16 border-4 border-background">
                                <AvatarImage src={creator.avatar_url || creator.profile_image_url || undefined} />
                                <AvatarFallback className="bg-muted text-lg font-semibold">
                                  {displayName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            {/* Creator Info */}
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{displayName}</h3>
                                {creator.tags && creator.tags.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {creator.tags[0]}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {creator.bio || "Creator on the platform"}
                              </p>
                              
                              {/* Metrics */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{(creator.follower_count || 0).toLocaleString()}</span>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleFollow(creator.id)}
                                >
                                  Follow
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.location.href = `/creator/${creator.username || creator.id}`}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
