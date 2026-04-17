
import { MainLayout } from "@/components/Layout/MainLayout";
import { useState, useEffect } from "react";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, ArrowLeft } from "lucide-react";
import { CreatorProfile } from "@/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortOption = "newest" | "oldest" | "popular" | "alphabetical";

export default function AllFeaturedCreatorsPage() {
  const { data: creators = [], isLoading } = usePopularCreators(true);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [sortedCreators, setSortedCreators] = useState<CreatorProfile[]>([]);

  // Helper function to get creator tags
  const getCreatorTags = (creator: CreatorProfile) => {
    const defaultTags = ["Game Dev"];

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

  // Sort creators based on selected option
  useEffect(() => {
    if (!creators.length) return;

    let sorted = [...creators];

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
      case "popular":
      default:
        // Keep original order for popular (as returned from API)
        break;
    }

    setSortedCreators(sorted);
  }, [creators, sortBy]);

  useEffect(() => {
    document.title = "Featured Sellers | FanRealms";
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6 bg-white">
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
              <h1 className="text-3xl font-bold mb-2 text-[#111]">Featured Sellers</h1>
              <p className="text-[#666]">
                Discover our hand-picked {creators.length} featured sellers on FanRealms
              </p>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#666]">Sort:</span>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array(12).fill(0).map((_, i) => (
              <Card key={`creator-skeleton-${i}`} className="bg-[#fafafa] border border-[#eee] overflow-hidden">
                <div className="h-24 bg-[#f5f5f5]" />
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
                <Card key={creator.id} className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                  <div className="h-24 bg-[#f5f5f5] relative">
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
                      <Avatar className="h-20 w-20 border-[4px] border-white">
                        <AvatarImage src={avatarUrl || '/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png'} alt={displayName} />
                        <AvatarFallback className="text-xl">
                          {avatarFallback}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <h3 className="text-xl font-bold mt-4 text-[#111]">{displayName}</h3>
                    <p className="text-[#666] text-sm mt-1 line-clamp-2">{creator.bio || "Seller on FanRealms"}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {getCreatorTags(creator).map((tag, index) => (
                        <span key={index} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-[#aaa]">
                        {creator.follower_count != null ? `${creator.follower_count} followers` : ""}
                      </div>
                      <Link to={creatorLink}>
                        <Button className="bg-primary hover:bg-[#3a7aab]" size="sm">View shop</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <Award className="h-16 w-16 mx-auto mb-4 text-[#bbb]" />
              <h3 className="text-xl font-semibold mb-2 text-[#666]">No Featured Sellers Found</h3>
              <p className="text-[#666]">Check back soon for new featured sellers!</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
