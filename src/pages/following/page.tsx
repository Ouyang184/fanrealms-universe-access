
import { useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Star,
  MessageSquare,
  Bell,
  Heart,
  MoreHorizontal,
  Users,
  Clock,
  Music,
  Palette,
  Gamepad2,
  Camera,
  BookOpen,
  Coffee,
  Dumbbell,
  Check,
} from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useCreators } from "@/hooks/useCreators";
import { useFollow } from "@/hooks/useFollow";
import { CreatorProfile } from "@/types";
import { LoadingView } from "@/components/ui/loading-view";

// Categories with icons
const categories = [
  { name: "All", icon: <Users className="h-4 w-4" /> },
  { name: "Art", icon: <Palette className="h-4 w-4" /> },
  { name: "Gaming", icon: <Gamepad2 className="h-4 w-4" /> },
  { name: "Music", icon: <Music className="h-4 w-4" /> },
  { name: "Writing", icon: <BookOpen className="h-4 w-4" /> },
  { name: "Photography", icon: <Camera className="h-4 w-4" /> },
  { name: "Cooking", icon: <Coffee className="h-4 w-4" /> },
  { name: "Fitness", icon: <Dumbbell className="h-4 w-4" /> },
];

// Get tier badge color
const getTierColor = (color: string | undefined) => {
  switch (color) {
    case "purple":
      return "bg-purple-600";
    case "green":
      return "bg-green-600";
    case "blue":
      return "bg-blue-600";
    case "amber":
      return "bg-amber-600";
    case "cyan":
      return "bg-cyan-600";
    case "orange":
      return "bg-orange-600";
    case "red":
      return "bg-red-600";
    default:
      return "bg-primary";
  }
};

interface EnrichedCreatorProfile extends CreatorProfile {
  category?: string;
  tags?: string[];
  isLive?: boolean;
  isFavorite?: boolean;
  notifications?: number;
  rating?: number;
  subscribers?: number;
  lastPost?: string;
}

export default function FollowingPage() {
  const { data: creators = [] } = useCreators();
  const { subscriptions } = useSubscriptions();
  const { followCreator, unfollowCreator } = useFollow();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Get list of followed creators using subscription data and creators list
  const followedCreators: EnrichedCreatorProfile[] = creators
    .filter((creator) => subscriptions?.some((sub) => sub.creator_id === creator.id))
    .map((creator) => {
      // Assign random categories and other metadata for demonstration
      const categories = ["Art", "Gaming", "Music", "Writing", "Photography", "Cooking", "Fitness"];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomTags = [randomCategory, "Tutorials", "Creative"];
      
      return {
        ...creator,
        category: randomCategory,
        tags: randomTags,
        isLive: Math.random() > 0.8,
        isFavorite: favorites[creator.id] || Math.random() > 0.7,
        notifications: Math.floor(Math.random() * 4),
        rating: 4 + Math.random(),
        subscribers: Math.floor(Math.random() * 15000) + 1000,
        lastPost: ["2 hours ago", "Yesterday", "3 days ago", "1 week ago"][
          Math.floor(Math.random() * 4)
        ],
      };
    });
  
  // Get popular creators not followed
  const suggestedCreators = creators
    .filter((creator) => !followedCreators.some((fc) => fc.id === creator.id))
    .slice(0, 3)
    .map(creator => ({
      ...creator,
      subscribers: Math.floor(Math.random() * 15000) + 1000,
      category: ["Art", "Gaming", "Music"][Math.floor(Math.random() * 3)]
    }));

  // Calculate category counts
  const categoryCounts = categories.map(category => {
    const count = category.name === "All" 
      ? followedCreators.length 
      : followedCreators.filter(creator => creator.category === category.name).length;
    return { ...category, count };
  });

  const favoriteCount = followedCreators.filter(creator => creator.isFavorite).length;

  const toggleFavorite = (creatorId: string) => {
    setFavorites(prev => ({
      ...prev,
      [creatorId]: !prev[creatorId]
    }));
  };
  
  const filteredCreators = activeTab === "All" 
    ? followedCreators 
    : activeTab === "Favorites"
    ? followedCreators.filter(creator => creator.isFavorite)
    : followedCreators.filter(creator => creator.category === activeTab);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Following & Favorites</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Check className="h-4 w-4" />
              Mark All as Read
            </Button>
          </div>
        </div>

        {/* Rest of your content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <p className="text-muted-foreground">Manage your followed creators and favorites in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search creators..."
                className="pl-10 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Recently Updated</DropdownMenuItem>
                <DropdownMenuItem>Alphabetical</DropdownMenuItem>
                <DropdownMenuItem>Subscription Price</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Has New Content</DropdownMenuItem>
                <DropdownMenuItem>Currently Live</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Categories Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="overflow-auto flex w-full justify-start">
            {categoryCounts.map((category) => (
              <TabsTrigger
                key={category.name}
                value={category.name}
                className="flex items-center gap-2"
              >
                {category.icon}
                {category.name}
                <Badge variant="outline" className="ml-1">
                  {category.count}
                </Badge>
              </TabsTrigger>
            ))}
            <TabsTrigger value="Favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favorites
              <Badge variant="outline" className="ml-1">
                {favoriteCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {filteredCreators.length > 0 ? (
                filteredCreators.map((creator) => (
                  <Card key={creator.id}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Cover Image (only visible on larger screens) */}
                        <div className="hidden md:block w-48 h-full relative overflow-hidden">
                          <img
                            src={creator.banner_url || "/placeholder.svg"}
                            alt={creator.username || "Creator"}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Creator Info */}
                        <div className="flex-1 p-4 md:p-6">
                          <div className="flex items-start">
                            <Avatar className="h-16 w-16 mr-4">
                              <AvatarImage src={creator.avatar_url || "/placeholder.svg"} alt={creator.username || "Creator"} />
                              <AvatarFallback className="text-xl">{(creator.username || "C").charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xl font-bold">{creator.username}</h3>
                                  {creator.isLive && <Badge variant="destructive">LIVE</Badge>}
                                </div>
                                <div className="flex items-center gap-2">
                                  {creator.tiers && creator.tiers[0] && (
                                    <Badge className={getTierColor(creator.tiers[0].name)}>
                                      {creator.tiers[0].name}
                                    </Badge>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>View Creator Page</DropdownMenuItem>
                                      <DropdownMenuItem>Change Subscription Tier</DropdownMenuItem>
                                      <DropdownMenuItem>Notification Settings</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => unfollowCreator(creator.id)} className="text-destructive">Unfollow</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <p className="text-muted-foreground text-sm mt-1">{creator.bio || "No bio available"}</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {creator.tags?.map((tag, index) => (
                                  <Badge key={index} variant="outline">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{creator.subscribers?.toLocaleString() || '0'} subscribers</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{creator.rating?.toFixed(1) || '0.0'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Last post: {creator.lastPost || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 md:mt-0">
                              {(creator.notifications || 0) > 0 && (
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Bell className="h-4 w-4" />
                                  {creator.notifications} New
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className={`gap-2 ${creator.isFavorite ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
                                onClick={() => toggleFavorite(creator.id)}
                              >
                                <Heart className={`h-4 w-4 ${creator.isFavorite ? 'fill-primary' : ''}`} />
                                {creator.isFavorite ? 'Favorited' : 'Favorite'}
                              </Button>
                              <Button variant="outline" size="sm" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Message
                              </Button>
                              <Button>View Content</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No creators found</h3>
                  <p className="text-muted-foreground mb-6">
                    {activeTab === "All"
                      ? "You haven't followed any creators yet. Explore to find creators to follow!"
                      : `You don't have any creators in the ${activeTab} category.`}
                  </p>
                  <Button>Explore Creators</Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Suggestions Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6">Suggested Creators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedCreators.map((creator) => (
              <Card key={creator.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={creator.avatar_url || "/placeholder.svg"} alt={creator.username || "Creator"} />
                      <AvatarFallback>{(creator.username || "C").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold">{creator.username}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {creator.bio || "No bio available"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {creator.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{creator.subscribers?.toLocaleString()} subscribers</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => followCreator(creator.id)}>Follow</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
