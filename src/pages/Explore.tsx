import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  TrendingUp,
  Star,
  Clock,
  Video,
  FileText,
  Heart,
  ChevronRight,
  Award,
  Users,
  Zap,
  Music,
  Palette,
  Camera,
  Code,
  BookOpen,
  Coffee,
  Gamepad2,
  Mic,
  Dumbbell,
  Eye,
  Bell,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CategoryGrid } from "@/components/onboarding/CategoryGrid"

// Sample data for featured creators
const featuredCreators = [
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
    },
    tags: ["Digital Art", "Illustration", "Tutorials"],
    featured: true,
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
    },
    tags: ["Game Development", "Unity", "Coding"],
    featured: true,
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
    },
    tags: ["Music Production", "Samples", "Tutorials"],
    featured: true,
  },
]

// Sample data for trending content
const trendingContent = [
  {
    id: 1,
    title: "Character Design Masterclass",
    creator: "Digital Art Master",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Character+Design",
    type: "video",
    duration: "1h 24m",
    views: 24500,
    likes: 1840,
    comments: 342,
    trending: true,
    tier: "Pro Artist",
  },
  {
    id: 2,
    title: "Advanced Unity Game AI Systems",
    creator: "Game Development Pro",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Game+AI",
    type: "tutorial",
    duration: "2h 10m",
    views: 18700,
    likes: 1250,
    comments: 215,
    trending: true,
    tier: "Indie Developer",
  },
  {
    id: 3,
    title: "Mixing Vocals Like a Pro",
    creator: "Music Production Studio",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Vocal+Mixing",
    type: "video",
    duration: "45m",
    views: 32100,
    likes: 2430,
    comments: 378,
    trending: true,
    tier: "Producer Plus",
  },
  {
    id: 4,
    title: "Digital Painting Fundamentals",
    creator: "Digital Art Master",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Digital+Painting",
    type: "course",
    duration: "5h 30m",
    views: 15800,
    likes: 1120,
    comments: 195,
    trending: true,
    tier: "Basic",
  },
]

// Sample data for categories
const categories = [
  { id: 1, name: "Art & Illustration", icon: <Palette className="h-5 w-5" />, count: 1250 },
  { id: 2, name: "Gaming", icon: <Gamepad2 className="h-5 w-5" />, count: 980 },
  { id: 3, name: "Music", icon: <Music className="h-5 w-5" />, count: 1540 },
  { id: 4, name: "Writing", icon: <BookOpen className="h-5 w-5" />, count: 720 },
  { id: 5, name: "Photography", icon: <Camera className="h-5 w-5" />, count: 890 },
  { id: 6, name: "Programming", icon: <Code className="h-5 w-5" />, count: 1050 },
  { id: 7, name: "Podcasts", icon: <Mic className="h-5 w-5" />, count: 650 },
  { id: 8, name: "Fitness", icon: <Dumbbell className="h-5 w-5" />, count: 480 },
  { id: 9, name: "Cooking", icon: <Coffee className="h-5 w-5" />, count: 750 },
]

// Sample data for recommended creators
const recommendedCreators = [
  {
    id: 4,
    name: "Writing Workshop",
    username: "writingworkshop",
    avatar: "/placeholder.svg?height=60&width=60",
    description: "Creative writing courses and feedback",
    subscribers: 6200,
    tier: {
      name: "Author's Circle",
      price: 20,
    },
    tags: ["Writing", "Fiction", "Publishing"],
  },
  {
    id: 5,
    name: "Photo Masters",
    username: "photomasters",
    avatar: "/placeholder.svg?height=60&width=60",
    description: "Photography tutorials and presets",
    subscribers: 9400,
    tier: {
      name: "Pro Photographer",
      price: 15,
    },
    tags: ["Photography", "Editing", "Lightroom"],
  },
  {
    id: 6,
    name: "Cooking King",
    username: "cookingking",
    avatar: "/placeholder.svg?height=60&width=60",
    description: "Gourmet recipes and cooking techniques",
    subscribers: 11800,
    tier: {
      name: "Chef's Table",
      price: 12,
    },
    tags: ["Cooking", "Recipes", "Culinary"],
  },
  {
    id: 7,
    name: "Fitness Focus",
    username: "fitnessfocus",
    avatar: "/placeholder.svg?height=60&width=60",
    description: "Workout routines and nutrition advice",
    subscribers: 8500,
    tier: {
      name: "Elite Fitness",
      price: 18,
    },
    tags: ["Fitness", "Nutrition", "Workouts"],
  },
]

// Sample data for new releases
const newReleases = [
  {
    id: 5,
    title: "Landscape Photography Essentials",
    creator: "Photo Masters",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Landscape+Photography",
    type: "course",
    duration: "3h 15m",
    releaseDate: "2 days ago",
    tier: "Pro Photographer",
  },
  {
    id: 6,
    title: "Creative Writing: Character Development",
    creator: "Writing Workshop",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Character+Development",
    type: "workshop",
    duration: "1h 45m",
    releaseDate: "3 days ago",
    tier: "Author's Circle",
  },
  {
    id: 7,
    title: "Italian Cuisine Masterclass",
    creator: "Cooking King",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Italian+Cuisine",
    type: "video",
    duration: "2h 30m",
    releaseDate: "5 days ago",
    tier: "Chef's Table",
  },
  {
    id: 8,
    title: "Home Workout Series: No Equipment Needed",
    creator: "Fitness Focus",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Home+Workout",
    type: "series",
    duration: "4h total",
    releaseDate: "1 week ago",
    tier: "Basic",
  },
]

export default function ExplorePage() {
  // Get search parameters to check if we're filtering by category
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  
  // Set document title when component mounts
  useEffect(() => {
    document.title = categoryFilter 
      ? `${categoryFilter} | FanRealms` 
      : "Explore | Creator Platform";
  }, [categoryFilter]);
  
  // State for filtered content based on category
  const [filteredCreators, setFilteredCreators] = useState(featuredCreators);
  const [filteredTrending, setFilteredTrending] = useState(trendingContent);
  const [filteredNewReleases, setFilteredNewReleases] = useState(newReleases);
  const [filteredRecommended, setFilteredRecommended] = useState(recommendedCreators);

  // Filter content when category changes
  useEffect(() => {
    if (categoryFilter) {
      // Filter creators based on tags matching the category
      const creators = featuredCreators.filter(creator => 
        creator.tags.some(tag => tag.toLowerCase().includes(categoryFilter.toLowerCase()))
      );
      setFilteredCreators(creators.length ? creators : featuredCreators);

      // Filter trending content based on creator (simplified approach)
      const trending = trendingContent.filter(content => 
        creators.some(creator => creator.name === content.creator)
      );
      setFilteredTrending(trending.length ? trending : trendingContent);

      // Filter new releases based on creator (simplified approach)
      const releases = newReleases.filter(content => 
        creators.some(creator => creator.name === content.creator)
      );
      setFilteredNewReleases(releases.length ? releases : newReleases);

      // Filter recommended creators based on tags matching the category
      const recommended = recommendedCreators.filter(creator => 
        creator.tags.some(tag => tag.toLowerCase().includes(categoryFilter.toLowerCase()))
      );
      setFilteredRecommended(recommended.length ? recommended : recommendedCreators);
    } else {
      // If no category filter, show all content
      setFilteredCreators(featuredCreators);
      setFilteredTrending(trendingContent);
      setFilteredNewReleases(newReleases);
      setFilteredRecommended(recommendedCreators);
    }
  }, [categoryFilter]);
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <section className="mb-10">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
            {/* Removed the img tag and using only the gradient background */}
            <div className="w-full h-64 bg-gradient-to-r from-purple-900 to-blue-900"></div>
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
              <h1 className="text-4xl font-bold mb-2">
                {categoryFilter ? `Explore ${categoryFilter}` : 'Explore FanRealms'}
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                {categoryFilter 
                  ? `Discover amazing ${categoryFilter} creators and their exclusive content`
                  : 'Discover amazing creators and exclusive content across various categories'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for creators, content, or topics..."
                    className="pl-10 bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500 w-full"
                  />
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Browse Categories</h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Use the CategoryGrid component instead of the previous grid */}
          <CategoryGrid 
            selectedCategories={[]} 
            onToggle={() => {}} 
            linkToCategory={true} 
          />
        </section>

        {/* Featured Creators */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {categoryFilter ? `${categoryFilter} Creators` : 'Featured Creators'}
            </h2>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => (
              <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900 relative">
                  <img
                    src={creator.coverImage || "/placeholder.svg"}
                    alt={creator.name}
                    className="w-full h-full object-cover mix-blend-overlay"
                  />
                  <Badge className="absolute top-2 right-2 bg-purple-600 flex items-center gap-1">
                    <Award className="h-3 w-3" /> Featured
                  </Badge>
                </div>
                <CardContent className="pt-0 -mt-12 p-6">
                  <div className="flex justify-between items-start">
                    <Avatar className="h-20 w-20 border-4 border-gray-900">
                      <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                      <AvatarFallback className="bg-gray-800 text-xl">{creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 mt-2 bg-gray-800 px-2 py-1 rounded-full">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm">{creator.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mt-4">{creator.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{creator.description}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {creator.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Avatar className="h-6 w-6 border-2 border-gray-900">
                      <AvatarFallback className="bg-purple-900 text-xs">U1</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                      <AvatarFallback className="bg-blue-900 text-xs">U2</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                      <AvatarFallback className="bg-green-900 text-xs">U3</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-400">+{creator.subscribers.toLocaleString()} subscribers</span>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      From <span className="font-medium text-white">${creator.tier.price}/mo</span>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700">View Creator</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Content Tabs */}
        <section className="mb-10">
          <Tabs defaultValue="trending" className="w-full">
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
                {filteredTrending.map((content) => (
                  <Card key={content.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                    <div className="relative">
                      <img
                        src={content.thumbnail || "/placeholder.svg"}
                        alt={content.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-orange-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Trending
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                        {content.duration}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {content.type === "video" && <Video className="h-3 w-3" />}
                        {content.type === "tutorial" && <FileText className="h-3 w-3" />}
                        {content.type === "course" && <BookOpen className="h-3 w-3" />}
                        {content.type}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={content.creatorAvatar || "/placeholder.svg"} alt={content.creator} />
                          <AvatarFallback className="text-xs">{content.creator.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-400">{content.creator}</span>
                      </div>
                      <h3 className="font-semibold line-clamp-2">{content.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {content.views.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {content.likes.toLocaleString()}
                        </div>
                        <Badge className="ml-auto bg-purple-600">{content.tier}</Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button variant="ghost" size="sm" className="text-purple-400 p-0">
                        Preview
                      </Button>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Subscribe
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredNewReleases.map((content) => (
                  <Card key={content.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                    <div className="relative">
                      <img
                        src={content.thumbnail || "/placeholder.svg"}
                        alt={content.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> New
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                        {content.duration}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {content.type === "video" && <Video className="h-3 w-3" />}
                        {content.type === "workshop" && <Users className="h-3 w-3" />}
                        {content.type === "course" && <BookOpen className="h-3 w-3" />}
                        {content.type === "series" && <FileText className="h-3 w-3" />}
                        {content.type}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={content.creatorAvatar || "/placeholder.svg"} alt={content.creator} />
                          <AvatarFallback className="text-xs">{content.creator.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-400">{content.creator}</span>
                      </div>
                      <h3 className="font-semibold line-clamp-2">{content.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {content.releaseDate}
                        </div>
                        <Badge className="ml-auto bg-purple-600">{content.tier}</Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button variant="ghost" size="sm" className="text-purple-400 p-0">
                        Preview
                      </Button>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Subscribe
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommended" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRecommended.map((creator) => (
                  <Card key={creator.id} className="bg-gray-900 border-gray-800 flex overflow-hidden">
                    <div className="p-4 flex-shrink-0">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                        <AvatarFallback className="bg-gray-800 text-xl">{creator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">{creator.name}</h3>
                        <Badge variant="outline" className="bg-gray-800 border-gray-700">
                          {creator.subscribers.toLocaleString()} subscribers
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{creator.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {creator.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm">
                          <span className="text-gray-400">From </span>
                          <span className="font-medium">${creator.tier.price}/mo</span>
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          View Creator
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Discover More */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Discover More</h2>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=400&text=Top+Rated"
                  alt="Top Rated Creators"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-xl font-bold">Top Rated Creators</h3>
                    <p className="text-sm text-gray-300 mt-1">Discover the highest rated creators on FanRealms</p>
                  </div>
                </div>
              </div>
              <CardFooter className="p-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Explore Top Rated</Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=400&text=New+Creators"
                  alt="New Creators"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-xl font-bold">New Creators</h3>
                    <p className="text-sm text-gray-300 mt-1">Support creators who are just getting started</p>
                  </div>
                </div>
              </div>
              <CardFooter className="p-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Discover New Talent</Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=400&text=Free+Content"
                  alt="Free Content"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-xl font-bold">Free Content</h3>
                    <p className="text-sm text-gray-300 mt-1">Explore free content from various creators</p>
                  </div>
                </div>
              </div>
              <CardFooter className="p-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Browse Free Content</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Join the Community */}
        <section className="mb-10">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4">Join Our Creator Community</h2>
                  <p className="text-gray-300 mb-6">
                    Start sharing your passion and expertise with subscribers around the world. Build your audience and
                    earn from your content on FanRealms.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-purple-600 hover:bg-purple-700">Become a Creator</Button>
                    <Button variant="outline">Learn More</Button>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <img
                    src="/placeholder.svg?height=200&width=200&text=Creator+Community"
                    alt="Creator Community"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Popular Tags */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Popular Tags</h2>
          <div className="flex flex-wrap gap-3">
            {[
              "Digital Art",
              "Game Development",
              "Music Production",
              "Photography",
              "Creative Writing",
              "Cooking",
              "Fitness",
              "Web Development",
              "Animation",
              "Podcasting",
              "Graphic Design",
              "3D Modeling",
              "Video Editing",
              "Illustration",
              "UI/UX Design",
            ].map((tag, index) => (
              <Badge key={index} className="bg-gray-800 hover:bg-gray-700 cursor-pointer text-sm py-1.5 px-3">
                {tag}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="text-purple-400">
              View All Tags
            </Button>
          </div>
        </section>

        {/* Newsletter */}
        <section>
          <Card className="bg-purple-900/30 border-purple-800">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
                  <p className="text-gray-300 mb-6">
                    Subscribe to our newsletter to get weekly updates on new creators, trending content, and exclusive
                    offers.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Enter your email"
                      className="bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500"
                    />
                    <Button className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">Subscribe</Button>
                  </div>
                </div>
                <div className="flex-shrink-0 hidden md:block">
                  <Bell className="h-20 w-20 text-purple-400 opacity-80" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}
