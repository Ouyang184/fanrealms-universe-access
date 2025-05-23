
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import { CreatorProfile } from "@/types";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { Skeleton } from "@/components/ui/skeleton";

// Define available categories with their display names and slugs
const categories = [
  { name: "Art & Illustration", slug: "art" },
  { name: "Writing & Literature", slug: "writing" },
  { name: "Music Production", slug: "music" },
  { name: "Game Development", slug: "games" },
  { name: "Photography", slug: "photography" },
  { name: "Software Development", slug: "software" },
];

interface CategoriesSectionProps {
  creators?: CreatorProfile[];
  isLoading?: boolean;
}

export function CategoriesSection({ creators = [], isLoading = false }: CategoriesSectionProps) {
  // Group creators by categories based on their bio content or tags
  const getCreatorsByCategory = (categorySlug: string) => {
    if (!creators.length) return [];

    // First try to match by tags
    const creatorsByTags = creators.filter(creator => 
      creator.tags?.some(tag => 
        tag.toLowerCase().includes(categorySlug.toLowerCase())
      )
    );
    
    if (creatorsByTags.length) return creatorsByTags.slice(0, 3);
    
    // If no matches by tags, try to match by bio content
    return creators
      .filter(creator => 
        creator.bio?.toLowerCase().includes(categorySlug.toLowerCase())
      )
      .slice(0, 3);
  };

  // Render loading skeletons
  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Browse Categories</h2>
          <Button variant="link" className="text-purple-400">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map(j => (
                  <Skeleton key={j} className="h-48 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Browse Categories</h2>
        <Link to="/explore">
          <Button variant="link" className="text-purple-400">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((category) => {
          const categoryCreators = getCreatorsByCategory(category.slug);
          
          return (
            <div key={category.slug} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{category.name}</h3>
                <Link to={`/explore?category=${category.slug}`}>
                  <Button variant="ghost" size="sm" className="text-purple-400 h-8">
                    See more
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {categoryCreators.length > 0 ? (
                  categoryCreators.map((creator) => (
                    <CreatorProfileCard key={creator.id} creator={creator} />
                  ))
                ) : (
                  // Fallback for when no creators match this category
                  [1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="bg-gradient-to-r from-primary/30 to-secondary/30 h-20" />
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${category.slug[0]}`} />
                            <AvatarFallback>{category.slug[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Join as a creator</p>
                            <p className="text-xs text-muted-foreground">Share your {category.name} content</p>
                          </div>
                        </div>
                        <Link to="/explore">
                          <Button size="sm" variant="outline" className="w-full">Explore {category.name}</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
