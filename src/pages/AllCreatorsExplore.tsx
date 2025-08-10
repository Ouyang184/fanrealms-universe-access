
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
  ChevronLeft,
  Check,
  SlidersHorizontal,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useCreators } from "@/hooks/useCreators";
import { CreatorProfile } from "@/types";
import { TagFilter } from "@/components/tags/TagFilter";

export default function AllCreatorsExplorePage() {
  const navigate = useNavigate();
  
  const [sortOption, setSortOption] = useState<string>("top-rated");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
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

    // Tag filter
    if (selectedTags.length > 0) {
      const lowerTags = selectedTags.map(t => t.toLowerCase());
      result = result.filter((creator) => {
        const tags = getCreatorTags(creator).map(t => t.toLowerCase());
        const bio = (creator.bio || "").toLowerCase();
        return lowerTags.some(tag => tags.includes(tag) || bio.includes(tag));
      });
    }
    
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
        {/* Removed hero banner to simplify layout like All Posts */}

        <section className="mb-4">
          <div className="flex items-center justify-end">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/explore')}>
              <ChevronLeft className="h-4 w-4" />
              Back to Explore
            </Button>
          </div>
        </section>

        <header className="mb-6">
          <h1 className="text-3xl font-bold">All Creators</h1>
          <p className="text-muted-foreground mt-1">Discover amazing creators across all categories.</p>
        </header>

        <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-purple-400" />
              <span className="font-medium">Filters:</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for creators, content, or topics..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    <Filter className="h-4 w-4" />
                    {`Sort: ${sortOption === 'top-rated' ? 'Top Rated' : sortOption === 'newest' ? 'Newest' : 'Most Popular'}`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem onClick={() => setSortOption('top-rated')} className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>Top Rated</span>
                    {sortOption === 'top-rated' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('newest')} className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Newest</span>
                    {sortOption === 'newest' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('most-popular')} className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Most Popular</span>
                    {sortOption === 'most-popular' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </section>

<section className="mb-6">
  <TagFilter selectedTags={selectedTags} onTagsChange={setSelectedTags} />
</section>

{/* Creators Grid */}
        <section className="mb-10">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold">
              {isLoadingCreators ? "Loading creators..." : `${displayCreators.length} Creators`}
            </h2>
          </div>

          {isLoadingCreators ? (
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
                const creatorLink = creator.username 
                  ? `/creator/${creator.username}` 
                  : `/creator/${creator.id}`;
                
                const displayName = creator.display_name || creator.username || "Creator";
                const avatarUrl = creator.profile_image_url || creator.avatar_url;
                const avatarFallback = (displayName || "C").substring(0, 1).toUpperCase();
                
                return (
                  <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900 relative">
                      {creator.banner_url && (
                        <img
                          src={creator.banner_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      )}
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
