import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState, useRef } from "react";
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
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { CreatorProfile } from "@/types";

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

// Category mapping for better tag matching
const categoryTagMapping = {
  "art-illustration": ["art", "illustration", "drawing", "painting", "digital art", "artwork"],
  "gaming": ["gaming", "games", "esports", "streaming", "twitch"],
  "music": ["music", "audio", "songs", "beats", "musician", "producer"],
  "writing": ["writing", "author", "stories", "poetry", "blog", "content"],
  "photography": ["photography", "photos", "camera", "portrait", "landscape"],
  "education": ["education", "teaching", "tutorial", "learning", "courses"],
  "podcasts": ["podcast", "audio", "talk", "interview", "radio"],
  "cooking": ["cooking", "food", "recipes", "chef", "culinary"],
  "fitness": ["fitness", "workout", "health", "gym", "exercise"],
  "technology": ["technology", "tech", "programming", "coding", "software"],
  "fashion": ["fashion", "style", "clothing", "beauty", "makeup"],
  "film-video": ["film", "video", "movies", "cinema", "youtube", "content creator"]
};

export default function ExploreCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  
  const [sortOption, setSortOption] = useState<string>("top-rated");
  const [contentType, setContentType] = useState<string>(category || "all");
  const [isContentTypeOpen, setIsContentTypeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Find the current category object based on route parameter
  const currentCategory = categories.find(cat => cat.route === category);
  
  // Fetch real creators from the database
  const { data: allCreators = [], isLoading: isLoadingCreators } = usePopularCreators(true);
  
  // Filter creators based on the selected category
  const [filteredCreators, setFilteredCreators] = useState<CreatorProfile[]>([]);
  
  // Add ref to track dropdown state
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Helper function to check if creator matches category
  const creatorMatchesCategory = (creator: CreatorProfile, categoryRoute: string) => {
    if (!categoryRoute || categoryRoute === "all") return true;
    
    const categoryTags = categoryTagMapping[categoryRoute] || [categoryRoute];
    const creatorBio = (creator.bio || "").toLowerCase();
    const creatorTags = (creator.tags || []).map(tag => tag.toLowerCase());
    
    // Check if any category tag matches creator's tags or bio
    return categoryTags.some(categoryTag => 
      creatorTags.some(tag => tag.includes(categoryTag) || categoryTag.includes(tag)) ||
      creatorBio.includes(categoryTag)
    );
  };
  
  useEffect(() => {
    // Set document title
    document.title = currentCategory 
      ? `${currentCategory.name} Creators | FanRealms` 
      : "Explore Categories | FanRealms";
    
    // Filter creators when category or creators data changes
    if (allCreators.length > 0) {
      const filtered = allCreators.filter(creator => 
        creatorMatchesCategory(creator, category || "all")
      );
      
      setFilteredCreators(filtered);
    } else {
      setFilteredCreators([]);
    }
    
    // Update contentType state when category route changes
    if (category) {
      setContentType(category);
    }
    
    // Add scroll event listener to close dropdown when scrolling
    const handleScroll = () => {
      if (isContentTypeOpen) {
        setIsContentTypeOpen(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [category, isContentTypeOpen, allCreators, currentCategory]);
  
  // Apply sorting and filtering to the creators list
  const applyFilters = (creators: CreatorProfile[]) => {
    if (!creators || creators.length === 0) return [];
    
    let result = [...creators];
    
    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(creator => 
        (creator.displayName || "").toLowerCase().includes(query) ||
        (creator.username || "").toLowerCase().includes(query) ||
        (creator.bio || "").toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortOption === "top-rated") {
      // Sort by number of tiers as a proxy for "rating" since we don't have ratings yet
      result.sort((a, b) => (b.tiers?.length || 0) - (a.tiers?.length || 0));
    } else if (sortOption === "newest") {
      // Sort by creation date
      result.sort((a, b) => {
        const dateA = new Date(a.created_at || Date.now()).getTime();
        const dateB = new Date(b.created_at || Date.now()).getTime();
        return dateB - dateA;
      });
    } else if (sortOption === "most-popular") {
      // Sort by total subscribers across all tiers
      result.sort((a, b) => {
        const subscribersA = (a.tiers || []).reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
        const subscribersB = (b.tiers || []).reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
        return subscribersB - subscribersA;
      });
    }
    
    return result;
  };
  
  const displayCreators = applyFilters(filteredCreators);
  
  // Navigate to a different category
  const handleCategoryChange = (categoryRoute: string) => {
    navigate(`/explore/${categoryRoute}`);
    setIsContentTypeOpen(false); // Close dropdown after selection
  };

  // Reset filters function
  const resetFilters = () => {
    setSortOption("top-rated");
    setSearchQuery("");
  };

  // Helper function to get creator tags
  const getCreatorTags = (creator: CreatorProfile) => {
    // Extract tags from bio or default to category tags
    const defaultTags = ["Content Creator"];
    
    if (!creator) return defaultTags;
    
    if (creator.tags && creator.tags.length > 0) {
      return creator.tags.slice(0, 3);
    }
    
    const bio = creator.bio || "";
    // Extract hashtags from bio
    const extractedTags = bio.match(/#\w+/g) || [];
    const formattedTags = extractedTags.map(tag => tag.replace('#', ''));
    
    // If no tags found in bio, extract keywords
    if (formattedTags.length === 0 && bio) {
      const keywords = bio.split(' ')
        .filter(word => word.length > 4)
        .slice(0, 3);
      return keywords.length > 0 ? keywords : defaultTags;
    }
    
    return formattedTags.length > 0 ? formattedTags : defaultTags;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
            <div className="w-full h-64 bg-gradient-to-r from-purple-900 to-blue-900"></div>
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
              <h1 className="text-4xl font-bold mb-2">
                {currentCategory ? `${currentCategory.name} Creators` : 'Explore FanRealms'}
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                {currentCategory
                  ? `Discover amazing ${currentCategory.name} creators and exclusive content`
                  : 'Discover amazing creators and exclusive content across various categories'}
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
              
              <DropdownMenu open={isContentTypeOpen} onOpenChange={setIsContentTypeOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Content Type
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="max-h-[350px] overflow-y-auto"
                  align="start"
                  sideOffset={8}
                  ref={dropdownRef}
                >
                  <ScrollArea className="h-full max-h-[300px]">
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
                  </ScrollArea>
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
              {isLoadingCreators 
                ? "Loading creators..." 
                : `${displayCreators.length} ${currentCategory ? `${currentCategory.name} ` : ''}Creators`}
            </h2>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {isLoadingCreators ? (
            // Loading state
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={`creator-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="h-32 bg-gray-800" />
                  <CardContent className="pt-0 -mt-12 p-6">
                    <div className="flex justify-between items-start">
                      <div className="h-20 w-20 rounded-full bg-gray-800" />
                    </div>
                    <div className="h-6 w-3/4 bg-gray-800 mt-4 rounded" />
                    <div className="h-4 w-full bg-gray-800 mt-2 rounded" />
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="h-5 w-16 bg-gray-800 rounded" />
                      <div className="h-5 w-20 bg-gray-800 rounded" />
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="h-5 w-16 bg-gray-800 rounded" />
                      <div className="h-10 w-24 bg-gray-800 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayCreators.map((creator) => {
                // Create proper route to creator profile
                const creatorLink = creator.username 
                  ? `/creator/${creator.username}` 
                  : `/creator/${creator.id}`;
                
                // Get display name with fallbacks
                const displayName = creator.display_name || creator.username || "Creator";
                
                // Get avatar URL with fallbacks
                const avatarUrl = creator.profile_image_url || creator.avatar_url;
                
                // Get first letter for avatar fallback
                const avatarFallback = (displayName || "C").substring(0, 1).toUpperCase();
                
                return (
                  <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden">
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
                          <AvatarImage src={avatarUrl || ''} alt={displayName} />
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
                        <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                          <a href={creatorLink}>View Creator</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-medium mb-2">No creators found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? "We couldn't find any creators matching your search. Try different keywords."
                  : `We couldn't find any ${currentCategory ? currentCategory.name : ''} creators yet. Check back soon!`}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              )}
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
