
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
  const { data: creators = [], isLoading } = useCreators(searchTerm);
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

  // Sort creators based on selected option
  useEffect(() => {
    if (!creators.length) return;

    // First filter by content type
    let filtered = filterCreatorsByContentType(creators, contentType);
    
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
  }, [creators, sortBy, contentType]);

  useEffect(() => {
    document.title = "All Creators | FanRealms";
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link to="/explore">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">All Creators</h1>
              <p className="text-gray-400">
                Discover all {sortedCreators.length} creators on FanRealms
              </p>
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Filters:</span>
                
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
                    <DropdownMenuItem onClick={() => setContentType("gaming")}>
                      Gaming
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("music")}>
                      Music
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("writing")}>
                      Writing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("photography")}>
                      Photography
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("education")}>
                      Education
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("podcasts")}>
                      Podcasts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("cooking")}>
                      Cooking
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("fitness")}>
                      Fitness
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("technology")}>
                      Technology
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("fashion")}>
                      Fashion
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContentType("film-video")}>
                      Film & Video
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Sort:</span>
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <Input
              placeholder="Search creators by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md bg-gray-800 border-gray-700"
            />
          </div>
        </div>

        {/* Creators Grid */}
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
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Creators Found</h3>
              <p>
                {searchTerm 
                  ? `No creators found matching "${searchTerm}"`
                  : "No creators have joined yet. Be the first!"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
