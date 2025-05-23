
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  Users,
  ChevronRight,
  ChevronLeft,
  Award,
  Check,
  SlidersHorizontal,
  TrendingUp,
  Clock,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample data for creators filtered by category
const sampleCreators = [
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
    category: "Art & Illustration",
    isPro: true,
    joinDate: "2022-05-15",
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
    category: "Gaming",
    isPro: true,
    joinDate: "2021-11-03",
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
    category: "Music",
    isPro: true,
    joinDate: "2022-01-20",
  },
  {
    id: 4,
    name: "Writing Workshop",
    username: "writingworkshop",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Writing+Workshop",
    description: "Creative writing courses and feedback",
    subscribers: 6200,
    rating: 4.6,
    tier: {
      name: "Author's Circle",
      price: 20,
    },
    tags: ["Writing", "Fiction", "Publishing"],
    featured: false,
    category: "Writing",
    isPro: true,
    joinDate: "2023-02-11",
  },
  {
    id: 5,
    name: "Photography Pro",
    username: "photopro",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Photography",
    description: "Photography tutorials and editing tips",
    subscribers: 9400,
    rating: 4.5,
    tier: {
      name: "Pro Photographer",
      price: 15,
    },
    tags: ["Photography", "Editing", "Lightroom"],
    featured: false,
    category: "Photography",
    isPro: false,
    joinDate: "2023-06-22",
  },
  {
    id: 6,
    name: "Education Insights",
    username: "eduinsights",
    avatar: "/placeholder.svg?height=100&width=100",
    coverImage: "/placeholder.svg?height=200&width=400&text=Education",
    description: "Educational content and teaching resources",
    subscribers: 7800,
    rating: 4.4,
    tier: {
      name: "Educator Plus",
      price: 12,
    },
    tags: ["Education", "Learning", "Resources"],
    featured: false,
    category: "Education",
    isPro: false,
    joinDate: "2022-09-15",
  },
];

// Categories data
const categories = [
  { id: 1, name: "Art & Illustration", icon: "🎨", route: "art-illustration" },
  { id: 2, name: "Gaming", icon: "🎮", route: "gaming" },
  { id: 3, name: "Music", icon: "🎵", route: "music" },
  { id: 4, name: "Writing", icon: "✍️", route: "writing" },
  { id: 5, name: "Photography", icon: "📷", route: "photography" },
  { id: 6, name: "Education", icon: "📚", route: "education" },
  { id: 7, name: "Podcasts", icon: "🎙️", route: "podcasts" },
  { id: 8, name: "Cooking", icon: "🍳", route: "cooking" },
  { id: 9, name: "Fitness", icon: "💪", route: "fitness" },
  { id: 10, name: "Technology", icon: "💻", route: "technology" },
  { id: 11, name: "Fashion", icon: "👗", route: "fashion" },
  { id: 12, name: "Film & Video", icon: "🎬", route: "film-video" },
];

export default function ExploreCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  
  const [sortOption, setSortOption] = useState<string>("top-rated");
  const [contentType, setContentType] = useState<string>(category || "all");
  
  // Find the current category object based on route parameter
  const currentCategory = categories.find(cat => cat.route === category);
  
  // Filter creators based on the selected category
  const [filteredCreators, setFilteredCreators] = useState(sampleCreators);
  
  useEffect(() => {
    // Set document title
    document.title = currentCategory 
      ? `${currentCategory.name} Creators | FanRealms` 
      : "Explore Categories | FanRealms";
    
    // Filter creators when category changes
    if (category) {
      const categoryName = categories.find(cat => cat.route === category)?.name;
      const filtered = sampleCreators.filter(creator => 
        creator.category === categoryName
      );
      setFilteredCreators(filtered.length > 0 ? filtered : sampleCreators);
    } else {
      setFilteredCreators(sampleCreators);
    }
    
    // Update contentType state when category route changes
    if (category) {
      setContentType(category);
    }
  }, [category]);
  
  // Apply sorting and filtering
  const applyFilters = (creators: typeof sampleCreators) => {
    let result = [...creators];
    
    // Apply sorting
    if (sortOption === "top-rated") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "newest") {
      result.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    } else if (sortOption === "most-popular") {
      result.sort((a, b) => b.subscribers - a.subscribers);
    }
    
    return result;
  };
  
  const displayCreators = applyFilters(filteredCreators);
  
  // Navigate to a different category
  const handleCategoryChange = (categoryRoute: string) => {
    navigate(`/explore/${categoryRoute}`);
  };

  // Reset filters function
  const resetFilters = () => {
    setSortOption("top-rated");
    setContentType("all");
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
            <img
              src="/placeholder.svg?height=400&width=1200&text=Discover+Creators"
              alt=""
              role="presentation"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
              <h1 className="text-4xl font-bold mb-2">
                {currentCategory ? currentCategory.name : 'Explore Categories'}
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                {currentCategory 
                  ? `Discover amazing ${currentCategory.name} creators and their exclusive content`
                  : 'Browse creators by category'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for creators..."
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

        {/* Back to All Categories Button */}
        <section className="mb-8">
          <div className="flex items-center justify-end">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/explore')}>
              <ChevronLeft className="h-4 w-4" />
              Back to All
            </Button>
          </div>
        </section>

        {/* Filtering and Sorting */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <SlidersHorizontal className="h-5 w-5 mr-2 text-purple-400" />
                <span className="mr-3 font-medium">Filters:</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Content Type
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={() => handleCategoryChange("all")} 
                    className="flex items-center gap-2"
                  >
                    {contentType === "all" && <Check className="h-4 w-4" />}
                    <span className={contentType === "all" ? "font-medium" : ""}>All Categories</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  {categories.map((cat) => (
                    <DropdownMenuItem 
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.route)} 
                      className="flex items-center gap-2"
                    >
                      {cat.route === contentType && <Check className="h-4 w-4" />}
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className={cat.route === contentType ? "font-medium" : ""}>{cat.name}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Sort: {sortOption === "top-rated" ? "Top Rated" : sortOption === "newest" ? "Newest" : "Most Popular"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOption("top-rated")} className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Top Rated</span>
                  {sortOption === "top-rated" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("newest")} className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Newest</span>
                  {sortOption === "newest" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("most-popular")} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Most Popular</span>
                  {sortOption === "most-popular" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* Creators Grid */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {displayCreators.length} {currentCategory ? `${currentCategory.name} ` : ''}Creators
            </h2>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {displayCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayCreators.map((creator) => (
                <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900 relative">
                    <img
                      src={creator.coverImage}
                      alt={creator.name}
                      className="w-full h-full object-cover mix-blend-overlay"
                    />
                    {creator.featured && (
                      <Badge className="absolute top-2 right-2 bg-purple-600 flex items-center gap-1">
                        <Award className="h-3 w-3" /> Featured
                      </Badge>
                    )}
                  </div>
                  <CardContent className="pt-0 -mt-12 p-6">
                    <div className="flex justify-between items-start">
                      <Avatar className="h-20 w-20 border-4 border-gray-900">
                        <AvatarImage src={creator.avatar} alt={creator.name} />
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
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">{creator.subscribers.toLocaleString()} subscribers</span>
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
          ) : (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-medium mb-2">No creators found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                We couldn't find any creators matching the current filters. Try adjusting your filter settings.
              </p>
              <Button 
                variant="outline"
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </section>

        {/* Newsletter */}
        <section>
          <Card className="bg-purple-900/30 border-purple-800">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
                  <p className="text-gray-300 mb-4">
                    Get notified when new {currentCategory ? currentCategory.name : ''} creators join FanRealms.
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700">Subscribe to Updates</Button>
                </div>
                <div className="text-7xl">{currentCategory?.icon || "✨"}</div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
