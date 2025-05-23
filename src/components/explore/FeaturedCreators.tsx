
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Award, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatorProfile } from "@/types";

interface FeaturedCreatorsProps {
  creators: CreatorProfile[];
  isLoading: boolean;
  categoryFilter: string | null;
}

export function FeaturedCreators({ creators, isLoading, categoryFilter }: FeaturedCreatorsProps) {
  // Helper function to get creator tags
  const getCreatorTags = (creator: CreatorProfile) => {
    // Extract tags from bio or default to category tags
    const defaultTags = ["Content Creator"];
    
    if (!creator) return defaultTags;
    
    const bio = creator.bio || "";
    // Extract hashtags or keywords from bio
    const extractedTags = bio.match(/#\w+/g) || [];
    const formattedTags = extractedTags.map(tag => tag.replace('#', ''));
    
    return formattedTags.length > 0 ? formattedTags : defaultTags;
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {categoryFilter ? `${categoryFilter} Creators` : 'Featured Creators'}
        </h2>
        <Button variant="link" className="text-purple-400">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <Card key={`creator-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="h-32 bg-gray-800" />
              <CardContent className="pt-0 -mt-12 p-6">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-20 w-20 rounded-md" />
                  <Skeleton className="h-6 w-20 mt-2" />
                </div>
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-full mt-2" />
                <div className="flex flex-wrap gap-2 mt-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full -ml-2" />
                  <Skeleton className="h-4 w-32 ml-2" />
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : creators.length > 0 ? (
          creators.map((creator) => (
            <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900 relative">
                {creator.banner_url && (
                  <img
                    src={creator.banner_url}
                    alt={creator.display_name || "Creator"}
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
                    <AvatarImage 
                      src={creator.profile_image_url || creator.avatar_url || `/placeholder.svg?text=${(creator.display_name || "C").substring(0, 1)}`} 
                      alt={creator.display_name || "Creator"} 
                    />
                    <AvatarFallback className="bg-gray-800 text-xl">
                      {(creator.display_name || "C").substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1 mt-2 bg-gray-800 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm">{(4 + Math.random()).toFixed(1)}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mt-4">{creator.display_name || "Creator"}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{creator.bio || "Creator on FanRealms"}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {getCreatorTags(creator).map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Avatar className="h-6 w-6 border-2 border-gray-900">
                    <AvatarFallback className="bg-purple-900 text-xs">U1</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                    <AvatarFallback className="bg-blue-900 text-xs">U2</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                    <AvatarFallback className="bg-green-900 text-xs">U3</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-400">+{Math.floor(Math.random() * 2000) + 500} subscribers</span>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    From <span className="font-medium text-white">${(9.99).toFixed(2)}/mo</span>
                  </div>
                  <Link to={`/creator/${creator.id}`}>
                    <Button className="bg-purple-600 hover:bg-purple-700">View Creator</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-10 text-gray-400">
            No creators found. Try adjusting your search or filters.
          </div>
        )}
      </div>
    </section>
  );
}
