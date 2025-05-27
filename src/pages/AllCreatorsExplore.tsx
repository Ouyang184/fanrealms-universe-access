
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Award,
  Check,
  SlidersHorizontal,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useCreators } from "@/hooks/useCreators";
import { CreatorProfile } from "@/types";

export default function AllCreatorsExplorePage() {
  const navigate = useNavigate();
  
  const [sortOption, setSortOption] = useState<string>("top-rated");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all creators from the database
  const { data: allCreators = [], isLoading: isLoadingCreators } = useCreators(searchQuery);
  
  useEffect(() => {
    // Set document title
    document.title = "All Creators | FanRealms";
  }, []);
  
  // Apply sorting to the creators list
  const applyFilters = (creators: CreatorProfile[]) => {
    if (!creators || creators.length === 0) return [];
    
    let result = [...creators];
    
    // Apply sorting
    if (sortOption === "top-rated") {
      result.sort((a, b) => (b.tiers?.length || 0) - (a.tiers?.length || 0));
    } else if (sortOption === "newest") {
      result.sort((a, b) => {
        const dateA = new Date(a.created_at || Date.now()).getTime();
        const dateB = new Date(b.created_at || Date.now()).getTime();
        return dateB - dateA;
      });
    } else if (sortOption === "most-popular") {
      result.sort((a, b) => {
        const subscribersA = (a.tiers || []).reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
        const subscribersB = (b.tiers || []).reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
        return subscribersB - subscribersA;
      });
    }
    
    return result;
  };
  
  const displayCreators = applyFilters(allCreators);

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

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <section className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">All Creators</h1>
              <p className="text-xl text-gray-400">
                Discover amazing creators and exclusive content across all categories
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => navigate('/explore')}>
              <ChevronLeft className="h-4 w-4" />
              Back to All
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search creators..."
              className="pl-10 bg-gray-900/50 border-gray-700 focus-visible:ring-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Filters Section */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/30 p-4 rounded-lg border border-gray-800">
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-gray-800 border-gray-700">
                    <Filter className="h-4 w-4" />
                    Content Type
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem>All Content</DropdownMenuItem>
                  <DropdownMenuItem>Videos</DropdownMenuItem>
                  <DropdownMenuItem>Images</DropdownMenuItem>
                  <DropdownMenuItem>Articles</DropdownMenuItem>
                  <DropdownMenuItem>Audio</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-gray-800 border-gray-700">
                    <SlidersHorizontal className="h-4 w-4" />
                    More Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem>Price Range</DropdownMenuItem>
                  <DropdownMenuItem>Rating</DropdownMenuItem>
                  <DropdownMenuItem>Language</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-gray-800 border-gray-700">
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

        {/* Results Count and Creators Grid */}
        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-300">
              {isLoadingCreators 
                ? "Loading creators..." 
                : `${displayCreators.length} results`}
            </h2>
          </div>

          {isLoadingCreators ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayCreators.map((creator) => {
                const creatorLink = creator.username 
                  ? `/creator/${creator.username}` 
                  : `/creator/${creator.id}`;
                
                const displayName = creator.display_name || creator.username || "Creator";
                const avatarUrl = creator.profile_image_url || creator.avatar_url;
                const avatarFallback = (displayName || "C").substring(0, 1).toUpperCase();
                
                return (
                  <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden hover:bg-gray-800/50 transition-colors">
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
                          <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700 text-xs">
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
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" asChild>
                          <a href={creatorLink}>View</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <h3 className="text-xl font-medium mb-2">No creators found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? "We couldn't find any creators matching your search. Try different keywords."
                  : "We couldn't find any creators yet. Check back soon!"}
              </p>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
