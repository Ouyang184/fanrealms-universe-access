
import { MainLayout } from "@/components/Layout/MainLayout";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award } from "lucide-react";
import { Link } from "react-router-dom";

export default function FeaturedCreatorsPage() {
  const { data: creators = [], isLoading } = usePopularCreators(true);

  const getCreatorTags = (creator: any) => {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Featured Creators</h1>
          <p className="text-gray-400">Discover the most popular creators on FanRealms</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <Card key={`featured-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
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
          ) : creators.length > 0 ? (
            creators.map((creator) => {
              const displayName = creator.displayName || creator.display_name || creator.username || "Creator";
              const avatarUrl = creator.profile_image_url || creator.avatar_url;
              const creatorLink = creator.username 
                ? `/creator/${creator.username}` 
                : `/creator/${creator.id}`;
              const avatarFallback = displayName.substring(0, 1).toUpperCase();
              
              return (
                <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden hover:border-purple-600 transition-colors">
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
                        <Button className="bg-purple-600 hover:bg-purple-700">View Creator</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-20">
              <h3 className="text-xl font-bold mb-2">No Featured Creators Yet</h3>
              <p className="text-gray-400 mb-4">Be the first to create content on FanRealms!</p>
              <Link to="/creator-studio/settings">
                <Button className="bg-purple-600 hover:bg-purple-700">Become a Creator</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
