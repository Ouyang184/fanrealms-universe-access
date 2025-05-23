
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award, ChevronRight } from "lucide-react";
import { CreatorProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedCreatorsProps {
  creators?: CreatorProfile[];
  isLoading?: boolean;
}

export function FeaturedCreators({ creators = [], isLoading = false }: FeaturedCreatorsProps) {
  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Creators</h2>
          <Button variant="link" className="text-purple-400">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardContent className="pt-0 -mt-12 p-6">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-20 w-20 rounded-md" />
                  <Skeleton className="h-6 w-24 mt-2" />
                </div>
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-full mt-1" />
                <div className="mt-6 flex items-center justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Featured Creators</h2>
        <Link to="/explore">
          <Button variant="link" className="text-purple-400">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.length > 0 ? (
          creators.map((creator) => (
            <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900">
                {creator.banner_url && (
                  <img 
                    src={creator.banner_url} 
                    alt={creator.displayName || ""} 
                    className="w-full h-full object-cover opacity-60"
                  />
                )}
              </div>
              <CardContent className="pt-0 -mt-12 p-6">
                <div className="flex justify-between items-start">
                  <Avatar className="h-20 w-20 border-4 border-gray-900">
                    <AvatarImage src={creator.avatar_url || creator.profile_image_url || ''} />
                    <AvatarFallback className="bg-gray-800 text-xl">
                      {(creator.displayName || creator.username || "").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="mt-2 bg-purple-600 flex items-center gap-1">
                    <Award className="h-3 w-3" /> Featured
                  </Badge>
                </div>
                <h3 className="text-xl font-bold mt-4">{creator.displayName || creator.username}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{creator.bio || "Creator on FanRealms"}</p>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {creator.tiers && creator.tiers.length > 0 ? (
                      <>From <span className="font-medium">${Math.min(...creator.tiers.map(tier => tier.price)).toFixed(2)}/mo</span></>
                    ) : (
                      <span className="font-medium">Free</span>
                    )}
                  </div>
                  <Link to={`/creator/${creator.id}`}>
                    <Button className="bg-purple-600 hover:bg-purple-700">Visit Page</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-10 text-gray-400">
            No featured creators found yet. Check back soon!
          </div>
        )}
      </div>
    </section>
  );
}
