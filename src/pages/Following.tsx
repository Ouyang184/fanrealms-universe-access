import { useEffect } from "react";
import { MainLayout } from "@/components/main-layout";
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
} from "lucide-react";

// Sample data for followed creators
const followedCreators = [
  {
    id: 1,
    name: "Digital Art Master",
    username: "artmaster",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Digital+Art",
    description: "Digital art and illustration tutorials for all skill levels",
    subscribers: 12500,
    rating: 4.8,
    tier: {
      name: "Pro Artist",
      price: 15,
      color: "purple",
    },
    tags: ["Digital Art", "Illustration", "Tutorials"],
    category: "Art",
    lastPost: "2 hours ago",
    notifications: 3,
    isLive: false,
    isFavorite: true,
  },
  {
    id: 2,
    name: "Game Development Pro",
    username: "gamedevpro",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Game+Dev",
    description: "Game development tutorials, assets, and behind-the-scenes content",
    subscribers: 8700,
    rating: 4.7,
    tier: {
      name: "Indie Developer",
      price: 25,
      color: "green",
    },
    tags: ["Game Development", "Unity", "Coding"],
    category: "Gaming",
    lastPost: "Yesterday",
    notifications: 1,
    isLive: true,
  },
  {
    id: 3,
    name: "Music Production Studio",
    username: "musicstudio",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Music+Production",
    description: "Music production tutorials, sample packs, and exclusive tracks",
    subscribers: 15300,
    rating: 4.9,
    tier: {
      name: "Producer Plus",
      price: 10,
      color: "blue",
    },
    tags: ["Music Production", "Samples", "Tutorials"],
    category: "Music",
    lastPost: "3 days ago",
    notifications: 0,
    isLive: false,
    isFavorite: true,
  },
  {
    id: 4,
    name: "Writing Workshop",
    username: "writingworkshop",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Writing",
    description: "Creative writing courses and feedback",
    subscribers: 6200,
    rating: 4.6,
    tier: {
      name: "Author's Circle",
      price: 20,
      color: "amber",
    },
    tags: ["Writing", "Fiction", "Publishing"],
    category: "Writing",
    lastPost: "1 week ago",
    notifications: 0,
    isLive: false,
  },
  {
    id: 5,
    name: "Photo Masters",
    username: "photomasters",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Photography",
    description: "Photography tutorials and presets",
    subscribers: 9400,
    rating: 4.7,
    tier: {
      name: "Pro Photographer",
      price: 15,
      color: "cyan",
    },
    tags: ["Photography", "Editing", "Lightroom"],
    category: "Photography",
    lastPost: "5 days ago",
    notifications: 2,
    isLive: false,
    isFavorite: true,
  },
  {
    id: 6,
    name: "Cooking King",
    username: "cookingking",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Cooking",
    description: "Gourmet recipes and cooking techniques",
    subscribers: 11800,
    rating: 4.8,
    tier: {
      name: "Chef's Table",
      price: 12,
      color: "orange",
    },
    tags: ["Cooking", "Recipes", "Culinary"],
    category: "Cooking",
    lastPost: "2 days ago",
    notifications: 0,
    isLive: true,
  },
  {
    id: 7,
    name: "Fitness Focus",
    username: "fitnessfocus",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Fitness",
    description: "Workout routines and nutrition advice",
    subscribers: 8500,
    rating: 4.5,
    tier: {
      name: "Elite Fitness",
      price: 18,
      color: "red",
    },
    tags: ["Fitness", "Nutrition", "Workouts"],
    category: "Fitness",
    lastPost: "4 days ago",
    notifications: 1,
    isLive: false,
  },
];

// Categories with icons
const categories = [
  { name: "All", count: followedCreators.length, icon: <Users className="h-4 w-4" /> },
  {
    name: "Art",
    count: followedCreators.filter((c) => c.category === "Art").length,
    icon: <Palette className="h-4 w-4" />,
  },
  {
    name: "Gaming",
    count: followedCreators.filter((c) => c.category === "Gaming").length,
    icon: <Gamepad2 className="h-4 w-4" />,
  },
  {
    name: "Music",
    count: followedCreators.filter((c) => c.category === "Music").length,
    icon: <Music className="h-4 w-4" />,
  },
  {
    name: "Writing",
    count: followedCreators.filter((c) => c.category === "Writing").length,
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    name: "Photography",
    count: followedCreators.filter((c) => c.category === "Photography").length,
    icon: <Camera className="h-4 w-4" />,
  },
  {
    name: "Cooking",
    count: followedCreators.filter((c) => c.category === "Cooking").length,
    icon: <Coffee className="h-4 w-4" />,
  },
  {
    name: "Fitness",
    count: followedCreators.filter((c) => c.category === "Fitness").length,
    icon: <Dumbbell className="h-4 w-4" />,
  },
];

// Get tier badge color
const getTierColor = (color: string) => {
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
      return "bg-purple-600";
  }
};

export default function Following() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Following | Creator Platform";
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Following & Favorites</h1>
            <p className="text-muted-foreground">Manage your followed creators and favorites in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search creators..."
                className="pl-10 w-[200px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
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
        <Tabs defaultValue="All" className="mb-8">
          <TabsList className="overflow-auto flex w-full justify-start">
            {categories.map((category) => (
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
                {followedCreators.filter((c) => c.isFavorite).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* All Creators Tab Content */}
          <TabsContent value="All" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {followedCreators.map((creator) => (
                <Card key={creator.id}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Cover Image (only visible on larger screens) */}
                      <div className="hidden md:block w-48 h-full relative overflow-hidden">
                        <img
                          src={creator.coverImage || "/placeholder.svg"}
                          alt={creator.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Creator Info */}
                      <div className="flex-1 p-4 md:p-6">
                        <div className="flex items-start">
                          <Avatar className="h-16 w-16 mr-4">
                            <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                            <AvatarFallback className="text-xl">{creator.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold">{creator.name}</h3>
                                {creator.isLive && <Badge variant="destructive">LIVE</Badge>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getTierColor(creator.tier.color)}`}>{creator.tier.name}</Badge>
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
                                    <DropdownMenuItem className="text-destructive">Unfollow</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <p className="text-muted-foreground text-sm mt-1">{creator.description}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {creator.tags.map((tag, index) => (
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
                              <span>{creator.subscribers.toLocaleString()} subscribers</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>{creator.rating}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Last post: {creator.lastPost}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3 md:mt-0">
                            {creator.notifications > 0 && (
                              <Button variant="outline" size="sm" className="gap-2">
                                <Bell className="h-4 w-4" />
                                {creator.notifications} New
                              </Button>
                            )}
                            {creator.isFavorite ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-primary/30 text-primary border-primary/70"
                              >
                                <Heart className="h-4 w-4 fill-primary" />
                                Favorited
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="gap-2">
                                <Heart className="h-4 w-4" />
                                Favorite
                              </Button>
                            )}
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
              ))}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="Favorites" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {followedCreators
                .filter((creator) => creator.isFavorite)
                .map((creator) => (
                  <Card key={creator.id}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Cover Image (only visible on larger screens) */}
                        <div className="hidden md:block w-48 h-full relative overflow-hidden">
                          <img
                            src={creator.coverImage || "/placeholder.svg"}
                            alt={creator.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Creator Info */}
                        <div className="flex-1 p-4 md:p-6">
                          <div className="flex items-start">
                            <Avatar className="h-16 w-16 mr-4">
                              <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                              <AvatarFallback className="text-xl">
                                {creator.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xl font-bold">{creator.name}</h3>
                                  {creator.isLive && <Badge variant="destructive">LIVE</Badge>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getTierColor(creator.tier.color)}`}>{creator.tier.name}</Badge>
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
                                      <DropdownMenuItem className="text-destructive">
                                        Remove from Favorites
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <p className="text-muted-foreground text-sm mt-1">{creator.description}</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {creator.tags.map((tag, index) => (
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
                                <span>{creator.subscribers.toLocaleString()} subscribers</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{creator.rating}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Last post: {creator.lastPost}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 md:mt-0">
                              {creator.notifications > 0 && (
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Bell className="h-4 w-4" />
                                  {creator.notifications} New
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-primary/30 text-primary border-primary/70"
                              >
                                <Heart className="h-4 w-4 fill-primary" />
                                Favorited
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
                ))}
            </div>
          </TabsContent>

          {/* Other category tabs */}
          {categories.slice(1).map((category) => (
            <TabsContent key={category.name} value={category.name} className="mt-6">
              <div className="grid grid-cols-1 gap-4">
                {followedCreators
                  .filter((creator) => creator.category === category.name)
                  .map((creator) => (
                    <Card key={creator.id}>
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Cover Image (only visible on larger screens) */}
                          <div className="hidden md:block w-48 h-full relative overflow-hidden">
                            <img
                              src={creator.coverImage || "/placeholder.svg"}
                              alt={creator.name}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          {/* Creator Info */}
                          <div className="flex-1 p-4 md:p-6">
                            <div className="flex items-start">
                              <Avatar className="h-16 w-16 mr-4">
                                <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                                <AvatarFallback className="text-xl">
                                  {creator.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold">{creator.name}</h3>
                                    {creator.isLive && <Badge variant="destructive">LIVE</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${getTierColor(creator.tier.color)}`}>{creator.tier.name}</Badge>
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
                                        <DropdownMenuItem className="text-destructive">Unfollow</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                <p className="text-muted-foreground text-sm mt-1">{creator.description}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {creator.tags.map((tag, index) => (
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
                                  <span>{creator.subscribers.toLocaleString()} subscribers</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  <span>{creator.rating}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>Last post: {creator.lastPost}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3 md:mt-0">
                                {creator.notifications > 0 && (
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Bell className="h-4 w-4" />
                                    {creator.notifications} New
                                  </Button>
                                )}
                                {creator.isFavorite ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 bg-primary/30 text-primary border-primary/70"
                                  >
                                    <Heart className="h-4 w-4 fill-primary" />
                                    Favorited
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Heart className="h-4 w-4" />
                                    Favorite
                                  </Button>
                                )}
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
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Suggestions Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6">Suggested Creators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={`/placeholder.svg?height=56&width=56&text=Creator+${i}`} />
                      <AvatarFallback>C{i}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold">Suggested Creator {i}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {i === 1
                          ? "Digital illustration and concept art tutorials"
                          : i === 2
                            ? "Game design theory and level building"
                            : "Music theory and composition lessons"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {i === 1 ? "Art" : i === 2 ? "Gaming" : "Music"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{i * 3 + 5}k subscribers</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button>Follow</Button>
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
