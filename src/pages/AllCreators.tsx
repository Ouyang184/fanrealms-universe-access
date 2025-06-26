import { MainLayout } from "@/components/Layout/MainLayout";
import { useState, useEffect } from "react";
import { useCreators } from "@/hooks/useCreators";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowLeft, Filter } from "lucide-react";
import { CreatorProfile } from "@/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "newest" | "oldest" | "popular" | "alphabetical" | "price-low" | "price-high";
type ContentType = "all" | "art-illustration" | "gaming" | "music" | "writing" | "photography" | "education" | "podcasts" | "cooking" | "fitness" | "technology" | "fashion" | "film-video";

export default function AllCreatorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { creators, isLoadingCreators } = useCreators(searchTerm);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [contentType, setContentType] = useState<ContentType>("all");
  const [sortedCreators, setSortedCreators] = useState<CreatorProfile[]>([]);

  // Helper function to get creator tags
  const getCreatorTags = (creator: CreatorProfile) => {
    const defaultTags = ["Creator"];
    
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

  // Filter creators based on content type
  const filterCreatorsByContentType = (creators: CreatorProfile[], type: ContentType) => {
    if (type === "all") return creators;
    
    return creators.filter(creator => {
      const tags = getCreatorTags(creator);
      const bio = creator.bio?.toLowerCase() || "";
      
      switch (type) {
        case "art-illustration":
          return tags.some(tag => tag.toLowerCase().includes("art")) || bio.includes("art") || bio.includes("illustration");
        case "gaming":
          return tags.some(tag => tag.toLowerCase().includes("gaming")) || bio.includes("gaming") || bio.includes("game");
        case "music":
          return tags.some(tag => tag.toLowerCase().includes("music")) || bio.includes("music") || bio.includes("musician");
        case "writing":
          return tags.some(tag => tag.toLowerCase().includes("writing")) || bio.includes("writing") || bio.includes("writer");
        case "photography":
          return tags.some(tag => tag.toLowerCase().includes("photo")) || bio.includes("photo") || bio.includes("photographer");
        case "education":
          return tags.some(tag => tag.toLowerCase().includes("education")) || bio.includes("education") || bio.includes("teaching");
        case "podcasts":
          return tags.some(tag => tag.toLowerCase().includes("podcast")) || bio.includes("podcast");
        case "cooking":
          return tags.some(tag => tag.toLowerCase().includes("cooking")) || bio.includes("cooking") || bio.includes("chef");
        case "fitness":
          return tags.some(tag => tag.toLowerCase().includes("fitness")) || bio.includes("fitness") || bio.includes("workout");
        case "technology":
          return tags.some(tag => tag.toLowerCase().includes("tech")) || bio.includes("technology") || bio.includes("tech");
        case "fashion":
          return tags.some(tag => tag.toLowerCase().includes("fashion")) || bio.includes("fashion") || bio.includes("style");
        case "film-video":
          return tags.some(tag => tag.toLowerCase().includes("film")) || bio.includes("film") || bio.includes("video");
        default:
          return true;
      }
    });
  };

  // Sort creators based on selected option
  useEffect(() => {
    if (!creators || !creators.length) return;

    // First filter by content type
    let filtered = filterCreatorsByContentType(creators, contentType);
    
    // Filter by search term if present
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(creator => 
        (creator.display_name || "").toLowerCase().includes(query) ||
        (creator.displayName || "").toLowerCase().includes(query) ||
        (creator.username || "").toLowerCase().includes(query) ||
        (creator.bio || "").toLowerCase().includes(query)
      );
    }
    
    // Then sort the filtered results
    let sorted = [...filtered];

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
        sorted.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
        break;
    }

    setSortedCreators(sorted);
  }, [creators, sortBy, contentType, searchTerm]);

  useEffect(() => {
    document.title = "All Creators | FanRealms";
  }, []);

  const getContentTypeLabel = (type: ContentType) => {
    const labels: Record<ContentType, string> = {
      "all": "All Content",
      "art-illustration": "Art & Illustration",
      "gaming": "Gaming",
      "music": "Music",
      "writing": "Writing",
      "photography": "Photography",
      "education": "Education",
      "podcasts": "Podcasts",
      "cooking": "Cooking",
      "fitness": "Fitness",
      "technology": "Technology",
      "fashion": "Fashion",
      "film-video": "Film & Video"
    };
    return labels[type];
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
              <h1 className="text-4xl font-bold mb-2">All Creators</h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                Discover amazing creators and exclusive content across all categories
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for creators, content, or topics..."
                    className="pl-10 bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
          <div className="flex items-center justify-end">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/explore')}>
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
              
              {/* Content Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {getContentTypeLabel(contentType)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 z-50">
                  <DropdownMenuItem onClick={() => setContentType("all")}>
                    All Content
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setContentType("art-illustration")}>
                    Art & Illustration
                  </DropdownMenuItem>
                  
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Sort: {sortBy === "top-rated" ? "Top Rated" : sortBy === "newest" ? "Newest" : "Most Popular"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem onClick={() => setSortBy("newest")} className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Newest</span>
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
                : `${sortedCreators.length} Creators`}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedCreators.map((creator) => {
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
                          className="w-full h-full object-cover mix-blend-overlay"
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
              {searchTerm 
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
