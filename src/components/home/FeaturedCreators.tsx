
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import { CreatorProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorRatingStats } from "@/hooks/useCreatorRatingStats";
import { CreatorRatingDisplay } from "@/components/ratings/CreatorRatingDisplay";

interface FeaturedCreatorsProps {
  creators?: CreatorProfile[];
  isLoading?: boolean;
}

export function FeaturedCreators({ creators = [], isLoading = false }: FeaturedCreatorsProps) {
  const creatorIds = creators.map(creator => creator.id);
  const { stats, isLoading: isLoadingStats } = useCreatorRatingStats(creatorIds);

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Featured Creators</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Featured Creators</h2>
        <Link to="/explore">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creators.length > 0 ? (
          creators.map((creator) => {
            const displayName = creator.displayName || creator.display_name || creator.username || "Creator";
            const creatorLink = creator.username 
              ? `/creator/${creator.username}` 
              : `/creator/${creator.id}`;
            
            return (
              <Link
                key={creator.id}
                to={creatorLink}
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-foreground/20 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={creator.avatar_url || creator.profile_image_url || ''} />
                  <AvatarFallback className="text-sm">
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{displayName}</h3>
                  <p className="text-muted-foreground text-xs truncate">{creator.bio || "Creator on FanRealms"}</p>
                  {stats[creator.id] && stats[creator.id].total_ratings > 0 && (
                    <div className="mt-1">
                      <CreatorRatingDisplay 
                        rating={stats[creator.id].average_rating}
                        count={stats[creator.id].total_ratings}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-3 text-center py-10 text-muted-foreground">
            No featured creators found yet. Check back soon!
          </div>
        )}
      </div>
    </section>
  );
}
