import { MainLayout } from "@/components/Layout/MainLayout";
import { useState, useEffect } from "react";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Award, 
  ChevronLeft, 
  Search,
  Filter,
  Star,
  ChevronRight,
  Check,
  SlidersHorizontal,
  TrendingUp,
  Clock
} from "lucide-react";
import { CreatorProfile } from "@/types";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type SortOption = "newest" | "oldest" | "popular" | "alphabetical" | "price-low" | "price-high";

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

export default function AllFeaturedCreatorsPage() {
  const navigate = useNavigate();
  const { data: creators = [], isLoading } = usePopularCreators(true);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [sortedCreators, setSortedCreators] = useState<CreatorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentType, setContentType] = useState<string>("all");

  // Helper function to get creator tags
  const getCreatorTags = (creator: CreatorProfile) => {
    const defaultTags = ["Content Creator"];
    
    if (!creator) return defaultTags;
    
    if (creator.tags && creator.tags.length > 0) {
      return creator.tags.slice(0, 3);
    }
    
    const bio = creator.bio || "";
    const extractedTags = bio.match(/#\w+/g) || [];
    const formattedTags = extractedTags.map(tag => tag.replace('#', ''));
    
    if (formattedTags.length === 0 && bio) {
      const keywords = bio.split(' ')
        .filter(word => word.length > 4)
        .slice(0, 3);
      return keywords.length > 0 ? keywords : defaultTags;
    }
    
    return formattedTags.length > 0 ? formattedTags : defaultTags;
  };

  // Navigate to a different category
  const handleCategoryChange = (categoryRoute: string) => {
    if (categoryRoute === "all") {
      navigate('/explore');
    } else {
      navigate(`/explore/${categoryRoute}`);
    }
  };

  // Sort creators based on selected option
  useEffect(() => {
    if (!creators.length) return;

    let sorted = [...creators];

    // Filter by search query first
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sorted = sorted.filter(creator => 
        (creator.displayName || creator.display_name || creator.username || "").toLowerCase().includes(query) ||
        (creator.bio || "").toLowerCase().includes(query)
      );
    }

    // Then apply sorting
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "alphabetical":
        sorted.sort((a, b) => {
          const nameA = a.displayName || a.display_name || a.username || "";
          const nameB = b.displayName || b.display_name || b.username || "";
          return nameA.localeCompare(nameB);
        });
        break;
      case "price-low":
        sorted.sort((a, b) => {
          const minPriceA = a.tiers && a.tiers.length > 0 ? Math.min(...a.tiers.map(tier => tier.price)) : 0;
          const minPriceB = b.tiers && b.tiers.length > 0 ? Math.min(...b.tiers.map(tier => tier.price)) : 0;
          return minPriceA - minPriceB;
        });
        break;
      case "price-high":
        sorted.sort((a, b) => {
          const minPriceA = a.tiers && a.tiers.length > 0 ? Math.min(...a.tiers.map(tier => tier.price)) : 0;
          const minPriceB = b.tiers && b.tiers.length > 0 ? Math.min(...b.tiers.map(tier => tier.price)) : 0;
          return minPriceB - minPriceA;
        });
        break;
      case "popular":
      default:
        // Keep original order for popular (as returned from API)
        break;
    }

    setSortedCreators(sorted);
  }, [creators, sortBy, searchQuery]);

  useEffect(() => {
    document.title = "All Featured Creators | FanRealms";
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
            <div className="w-full h-64 bg-gradient-to-r from-purple-900 to-blue-900"></div>
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
              <h1 className="text-4xl font-bold mb-2">All Featured Creators</h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                Discover all {creators.length} featured creators on FanRealms
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for creators, content, or topics..."
                    className="pl-10 bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Back to Explore Button */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="gap-2" onClick={() => navigate('/explore')}>
              <ChevronLeft className="h-4 w-4" />
              Back to Explore
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
                <DropdownMenuContent className="bg-gray-900 border-gray-800">
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
                  Sort: {sortBy === "popular" ? "Most Popular" : sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "alphabetical" ? "A-Z" : sortBy === "price-low" ? "Price: Low to High" : "Price: High to Low"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem onClick={() => setSortBy("popular")} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Most Popular</span>
                  {sortBy === "popular" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("newest")} className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Newest</span>
                  {sortBy === "newest" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")} className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Oldest</span>
                  {sortBy === "oldest" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("alphabetical")} className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>A-Z</span>
                  {sortBy === "alphabetical" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-low")} className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Price: Low to High</span>
                  {sortBy === "price-low" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-high")} className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Price: High to Low</span>
                  {sortBy === "price-high" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* Creators Grid */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {isLoading 
                ? "Loading creators..." 
                : `${sortedCreators.length} Featured Creators`}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array(12).fill(0).map((_, i) => (
                <Card key={`creator-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="h-32 bg-gray-800" />
                  <CardContent className="pt-0 -mt-12 p-6">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-20 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mt-4" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : sortedCreators.length > 0 ? (
              sortedCreators.map((creator) => {
                const displayName = creator.displayName || creator.display_name || creator.username || "Creator";
                const avatarUrl = creator.profile_image_url || creator.avatar_url;
                const creatorLink = creator.username 
                  ? `/creator/${creator.username}` 
                  : `/creator/${creator.id}`;
                const avatarFallback = displayName.substring(0, 1).toUpperCase();
                
                return (
                  <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden hover:border-purple-500/50 transition-colors">
                    <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900 relative">
                      {creator.banner_url && (
                        <img
                          src={creator.banner_url}
                          alt={displayName}
                          className="w-full h-full object-cover mix-blend-overlay"
                        />
                      )}
                      <Badge className="absolute top-2 right-2 bg-purple-600 flex items-center gap-1">
                        <Award className="h-3 w-3" /> Featured
                      </Badge>
                    </div>
                    <CardContent className="pt-0 -mt-12 p-6">
                      <div className="flex justify-between items-start">
                        <Avatar className="h-20 w-20 border-4 border-gray-900">
                          <AvatarImage src={avatarUrl || '/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png'} alt={displayName} />
                          <AvatarFallback className="bg-gray-800 text-xl">
                            {avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <h3 className="text-xl font-bold mt-4">{displayName}</h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{creator.bio || "Creator on FanRealms"}</p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {getCreatorTags(creator).map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          {creator.tiers && creator.tiers.length > 0 ? (
                            <>From <span className="font-medium text-white">${Math.min(...creator.tiers.map(tier => tier.price)).toFixed(2)}/mo</span></>
                          ) : (
                            <span className="font-medium text-white">Free</span>
                          )}
                        </div>
                        <Link to={creatorLink}>
                          <Button className="bg-purple-600 hover:bg-purple-700" size="sm">View Creator</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 text-gray-400">
                <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Featured Creators Found</h3>
                <p>{searchQuery ? "No creators match your search query." : "Check back soon for new featured creators!"}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
