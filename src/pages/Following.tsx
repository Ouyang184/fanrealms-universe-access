
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import { CreatorProfile } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  Search, 
  Users, 
  Heart, 
  MessageSquare, 
  Share2, 
  BookOpen,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Filter,
  SortAsc
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnrichedCreatorProfile extends CreatorProfile {
  subscribers: number;
  category: string;
}

export default function FollowingPage() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Following | Creator Platform";
  }, []);

  const { user } = useAuth();
  const { subscriptions, loadingSubscriptions } = useSubscriptions();
  const { isFollowing, checkFollowStatus, followCreator, unfollowCreator, isLoading: followLoading } = useFollow();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [followingStatuses, setFollowingStatuses] = useState<Record<string, boolean>>({});

  // Get creators from subscriptions
  const followedCreators: EnrichedCreatorProfile[] = subscriptions?.map(sub => ({
    ...sub.creator,
    subscribers: Math.floor(Math.random() * 10000) + 100, // Mock data
    category: ["Art", "Music", "Writing", "Tech", "Gaming"][Math.floor(Math.random() * 5)],
    follower_count: sub.creator?.follower_count || 0,
  })) || [];

  // Check follow status for all creators
  useEffect(() => {
    const checkAllFollowStatuses = async () => {
      if (!followedCreators.length) return;
      
      const statuses: Record<string, boolean> = {};
      for (const creator of followedCreators) {
        if (creator.id) {
          const status = await checkFollowStatus(creator.id);
          statuses[creator.id] = status;
        }
      }
      setFollowingStatuses(statuses);
    };

    checkAllFollowStatuses();
  }, [followedCreators.length, checkFollowStatus]);

  // Filter and sort creators
  const filteredCreators = followedCreators
    .filter(creator => {
      const matchesSearch = creator.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          creator.bio?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || creator.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.display_name || "").localeCompare(b.display_name || "");
        case "followers":
          return (b.follower_count || 0) - (a.follower_count || 0);
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const handleUnfollow = async (creatorId: string) => {
    await unfollowCreator(creatorId);
    setFollowingStatuses(prev => ({ ...prev, [creatorId]: false }));
  };

  const handleRefollow = async (creatorId: string) => {
    await followCreator(creatorId);
    setFollowingStatuses(prev => ({ ...prev, [creatorId]: true }));
  };

  if (loadingSubscriptions) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Following</h1>
          <p className="text-muted-foreground">
            Manage your subscriptions and discover content from creators you follow
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Category: {filterCategory === "all" ? "All" : filterCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterCategory("all")}>All Categories</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Art")}>Art</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Music")}>Music</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Writing")}>Writing</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Tech")}>Tech</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Gaming")}>Gaming</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SortAsc className="h-4 w-4" />
                Sort by: {sortBy === "name" ? "Name" : sortBy === "followers" ? "Followers" : "Recent"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("followers")}>Followers</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("recent")}>Recently Followed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Following</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followedCreators.length}</div>
              <p className="text-xs text-muted-foreground">Active subscriptions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {followedCreators.reduce((sum, creator) => sum + (creator.follower_count || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Combined follower count</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(followedCreators.map(c => c.category)).size}
              </div>
              <p className="text-xs text-muted-foreground">Different categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          {/* Grid View */}
          <TabsContent value="grid" className="mt-6">
            {filteredCreators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No creators found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search criteria" : "You're not following any creators yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCreators.map((creator) => (
                  <Card key={creator.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 relative">
                        <img
                          src={creator.banner_url || "/placeholder.svg"}
                          alt="Creator banner"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/90 text-gray-900">
                            {creator.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                            <AvatarImage src={creator.avatar_url || creator.profile_image_url} />
                            <AvatarFallback>{creator.display_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{creator.display_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {(creator.follower_count || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {creator.bio || "No bio available"}
                        </p>
                        
                        <div className="flex gap-2">
                          {followingStatuses[creator.id] ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnfollow(creator.id)}
                              disabled={followLoading}
                              className="flex-1"
                            >
                              Following
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleRefollow(creator.id)}
                              disabled={followLoading}
                              className="flex-1"
                            >
                              Follow Again
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-6">
            {filteredCreators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No creators found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search criteria" : "You're not following any creators yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCreators.map((creator) => (
                  <Card key={creator.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={creator.avatar_url || creator.profile_image_url} />
                          <AvatarFallback>{creator.display_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{creator.display_name}</h3>
                            <Badge variant="secondary">{creator.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {creator.bio || "No bio available"}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {(creator.follower_count || 0).toLocaleString()} followers
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {new Date(creator.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {followingStatuses[creator.id] ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnfollow(creator.id)}
                              disabled={followLoading}
                            >
                              Following
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleRefollow(creator.id)}
                              disabled={followLoading}
                            >
                              Follow Again
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
