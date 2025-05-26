
import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCreators } from "@/hooks/useCreators";
import { usePosts } from "@/hooks/usePosts";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ChevronRight,
  ChevronLeft,
  Check,
  SlidersHorizontal,
  TrendingUp,
  Clock,
} from "lucide-react";

// Import the refactored components
import { ExploreCategories } from "@/components/explore/ExploreCategories";
import { FeaturedCreators } from "@/components/explore/FeaturedCreators";
import { ContentTabs } from "@/components/explore/ContentTabs";
import { DiscoverSection } from "@/components/explore/DiscoverSection";
import { CommunitySection } from "@/components/explore/CommunitySection";
import { PopularTagsSection } from "@/components/explore/PopularTagsSection";
import { NewsletterSection } from "@/components/explore/NewsletterSection";

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

export default function ExplorePage() {
  const navigate = useNavigate();
  // Get search parameters to check if we're filtering by category
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  
  // Fetch real data from Supabase
  const { data: allCreators = [], isLoading: isLoadingCreators } = useCreators();
  const { data: posts = [], isLoading: isLoadingPosts } = usePosts();
  const { data: popularCreators = [], isLoading: isLoadingPopular } = usePopularCreators(true); // Explicitly exclude AI creators
  
  // Set document title when component mounts
  useEffect(() => {
    document.title = categoryFilter 
      ? `${categoryFilter} | FanRealms` 
      : "Explore | Creator Platform";
  }, [categoryFilter]);
  
  // State for filtered content based on category
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [filteredTrending, setFilteredTrending] = useState([]);
  const [filteredNewReleases, setFilteredNewReleases] = useState([]);
  const [filteredRecommended, setFilteredRecommended] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("top-rated");
  const [contentType, setContentType] = useState<string>("all");

  // Helper function to check if creator matches category
  const creatorMatchesCategory = (creator, category) => {
    if (!category) return true;
    
    const categoryTags = categoryTagMapping[category] || [category];
    const creatorBio = (creator.bio || "").toLowerCase();
    const creatorTags = (creator.tags || []).map(tag => tag.toLowerCase());
    
    // Check if any category tag matches creator's tags or bio
    return categoryTags.some(categoryTag => 
      creatorTags.some(tag => tag.includes(categoryTag) || categoryTag.includes(tag)) ||
      creatorBio.includes(categoryTag)
    );
  };

  // Filter content when category or search changes
  useEffect(() => {
    if (!popularCreators.length && !posts.length) return;
    
    // Start with real creators only, from the popular creators query (which already excludes AI)
    let creatorFilter = popularCreators;
    let postsFilter = posts;
    
    // Filter by category if present
    if (categoryFilter) {
      creatorFilter = popularCreators.filter(creator => 
        creatorMatchesCategory(creator, categoryFilter)
      );
      
      postsFilter = posts.filter(post => 
        (post.content || "").toLowerCase().includes(categoryFilter.toLowerCase()) ||
        (post.title || "").toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }
    
    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      creatorFilter = creatorFilter.filter(creator => 
        (creator.display_name || "").toLowerCase().includes(query) ||
        (creator.displayName || "").toLowerCase().includes(query) ||
        (creator.bio || "").toLowerCase().includes(query)
      );
      
      postsFilter = postsFilter.filter(post => 
        (post.title || "").toLowerCase().includes(query) ||
        (post.content || "").toLowerCase().includes(query)
      );
    }
    
    // Update state with filtered data
    setFilteredCreators(creatorFilter.slice(0, 3)); // Featured creators (limited to 3)
    setFilteredTrending(postsFilter.slice(0, 4)); // Trending posts
    setFilteredNewReleases(postsFilter.sort((a, b) => 
      new Date(b.createdAt || Date.now()).getTime() - 
      new Date(a.createdAt || Date.now()).getTime()
    ).slice(0, 4)); // Latest posts
    setFilteredRecommended(creatorFilter.slice(0, 4)); // Recommended creators
    
  }, [categoryFilter, searchQuery, popularCreators, posts]);

  // Navigate to a different category
  const handleCategoryChange = (categoryRoute: string) => {
    if (categoryRoute === "all") {
      navigate('/explore');
    } else {
      navigate(`/explore/${categoryRoute}`);
    }
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
                {categoryFilter ? `${categoryFilter} Creators` : 'Explore FanRealms'}
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                {categoryFilter
                  ? `Discover amazing ${categoryFilter} creators and exclusive content`
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

        {/* Back to Home Button */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="gap-2" onClick={() => navigate('/')}>
              <ChevronLeft className="h-4 w-4" />
              Back to Home
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
                      {cat.route === categoryFilter && <Check className="h-4 w-4" />}
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className={cat.route === categoryFilter ? "font-medium" : ""}>{cat.name}</span>
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
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
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

        {/* Categories Section */}
        <ExploreCategories />

        {/* Featured Creators - Only display real creators from the database */}
        <FeaturedCreators 
          creators={filteredCreators}
          isLoading={isLoadingCreators || isLoadingPopular}
          categoryFilter={categoryFilter}
        />

        {/* Content Tabs - Only display real content from the database */}
        <ContentTabs
          trendingPosts={filteredTrending}
          newReleases={filteredNewReleases}
          recommendedCreators={filteredRecommended}
          isLoadingPosts={isLoadingPosts}
          isLoadingCreators={isLoadingCreators || isLoadingPopular}
        />

        {/* Remove hardcoded data from DiscoverSection */}
        <DiscoverSection />

        {/* Popular Tags Section */}
        <PopularTagsSection />

        {/* Newsletter Section */}
        <NewsletterSection />
      </div>
    </MainLayout>
  )
}
