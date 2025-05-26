
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ChevronLeft,
  ChevronDown,
  Check,
} from "lucide-react";
import { FeaturedCreators } from "@/components/explore/FeaturedCreators";
import { ExploreCategories } from "@/components/explore/ExploreCategories";
import { ContentTabs } from "@/components/explore/ContentTabs";
import { DiscoverSection } from "@/components/explore/DiscoverSection";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { usePosts } from "@/hooks/usePosts";

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("most-popular");

  // Fetch data for content sections
  const { data: creators = [], isLoading: isLoadingCreators } = usePopularCreators();
  const { data: posts = [], isLoading: isLoadingPosts } = usePosts();

  // Filter creators based on search if needed
  const filteredCreators = searchQuery.trim() 
    ? creators.filter(creator => 
        (creator.displayName || creator.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (creator.bio || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : creators;

  // Apply sorting to creators
  const sortedCreators = [...filteredCreators].sort((a, b) => {
    if (sortOption === "most-popular") {
      const subscribersA = (a.tiers || []).reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
      const subscribersB = (b.tiers || []).reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
      return subscribersB - subscribersA;
    } else if (sortOption === "newest") {
      const dateA = new Date(a.created_at || Date.now()).getTime();
      const dateB = new Date(b.created_at || Date.now()).getTime();
      return dateB - dateA;
    } else if (sortOption === "top-rated") {
      return (b.tiers?.length || 0) - (a.tiers?.length || 0);
    }
    return 0;
  });

  const handleSearch = () => {
    // Search functionality could be enhanced here
    console.log("Searching for:", searchQuery);
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
              <h1 className="text-4xl font-bold mb-2">Explore FanRealms</h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                Discover amazing creators and exclusive content across various categories
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
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Back to All Button */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/')}>
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </section>

        {/* All Featured Creators Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">All Featured Creators</h2>
              <p className="text-gray-400 mt-1">
                Discover all {sortedCreators.length} featured creators on FanRealms
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Sort: {sortOption === "most-popular" ? "Most Popular" : sortOption === "newest" ? "Newest" : "Top Rated"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem onClick={() => setSortOption("most-popular")} className="flex items-center gap-2">
                  <span>Most Popular</span>
                  {sortOption === "most-popular" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("newest")} className="flex items-center gap-2">
                  <span>Newest</span>
                  {sortOption === "newest" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("top-rated")} className="flex items-center gap-2">
                  <span>Top Rated</span>
                  {sortOption === "top-rated" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <FeaturedCreators 
            creators={sortedCreators} 
            isLoading={isLoadingCreators}
            categoryFilter={null}
          />
        </section>

        {/* Categories Section */}
        <ExploreCategories />

        {/* Content Tabs */}
        <ContentTabs
          trendingPosts={posts.slice(0, 4)}
          newReleases={posts.slice(0, 4)}
          recommendedCreators={creators.slice(0, 4)}
          isLoadingPosts={isLoadingPosts}
          isLoadingCreators={isLoadingCreators}
        />

        {/* Discover More */}
        <DiscoverSection />
      </div>
    </MainLayout>
  );
}
