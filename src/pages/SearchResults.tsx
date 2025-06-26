
import { MainLayout } from "@/components/Layout/MainLayout";
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCreators } from "@/hooks/useCreators";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowLeft } from "lucide-react";
import { NSFWBadge } from "@/components/ui/nsfw-badge";
import { CreatorProfile } from "@/types";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  
  console.log("SearchResults - searchQuery:", searchQuery);
  
  // Always call the hook, but only search when there's a valid query
  const { creators, isLoadingCreators, creatorsError } = useCreators();

  console.log("SearchResults - creators data:", creators);
  console.log("SearchResults - isLoadingCreators:", isLoadingCreators);
  console.log("SearchResults - creatorsError:", creatorsError);

  // Filter creators based on search query
  const filteredCreators = creators?.filter(creator => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return (
      (creator.display_name || "").toLowerCase().includes(query) ||
      (creator.displayName || "").toLowerCase().includes(query) ||
      (creator.username || "").toLowerCase().includes(query) ||
      (creator.bio || "").toLowerCase().includes(query)
    );
  }) || [];

  useEffect(() => {
    document.title = searchQuery ? `"${searchQuery}" - Search Results | FanRealms` : "Search Results | FanRealms";
  }, [searchQuery]);

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
        {/* Header */}
        <div className="mb-8">
          <Link to="/explore">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-6 w-6 text-gray-400" />
            <h1 className="text-3xl font-bold">
              {searchQuery ? `Search Results for "${searchQuery}"` : "Search Results"}
            </h1>
          </div>
          
          {searchQuery && !isLoadingCreators && (
            <p className="text-gray-400">
              Found {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''} matching your search
            </p>
          )}
        </div>

        {/* Results */}
        {!searchQuery ? (
          <div className="text-center py-20 text-gray-400">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Start Your Search</h3>
            <p>Enter a search term to find creators on FanRealms</p>
          </div>
        ) : isLoadingCreators ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <Card key={`search-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
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
            ))}
          </div>
        ) : creatorsError ? (
          <div className="text-center py-20 text-red-400">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Search Error</h3>
            <p>There was an error searching for creators. Please try again.</p>
          </div>
        ) : filteredCreators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreators.map((creator) => {
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
                    {/* NSFW Badge */}
                    {creator.is_nsfw && (
                      <div className="absolute top-2 left-2">
                        <NSFWBadge variant="card" />
                      </div>
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
                    <div className="flex items-center gap-2 mt-4">
                      <h3 className="text-xl font-bold">{displayName}</h3>
                      {creator.is_nsfw && <NSFWBadge variant="card" />}
                    </div>
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
                        {creator.follower_count || 0} followers
                      </div>
                      <Link to={creatorLink}>
                        <Button className="bg-purple-600 hover:bg-purple-700" size="sm">View Creator</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p>No creators found matching "{searchQuery}". Try searching with different keywords.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
