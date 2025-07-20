import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCreators } from "@/hooks/useCreators";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { MainLayout } from "@/components/Layout/MainLayout";
import { CreatorProfile } from "@/types";

// Categories from CategoriesSection
const categories = [
  { name: "Art & Illustration", route: "art-illustration", keywords: ["art", "illustration", "drawing", "digital art", "painting"] },
  { name: "Gaming", route: "gaming", keywords: ["gaming", "games", "esports", "streaming", "twitch"] },
  { name: "Music", route: "music", keywords: ["music", "musician", "singer", "producer", "audio"] },
  { name: "Fitness", route: "fitness", keywords: ["fitness", "workout", "health", "yoga", "training"] },
  { name: "Cooking", route: "cooking", keywords: ["cooking", "chef", "recipe", "food", "culinary"] },
  { name: "Tech", route: "tech", keywords: ["tech", "technology", "programming", "coding", "software"] },
  { name: "Fashion", route: "fashion", keywords: ["fashion", "style", "design", "clothing", "model"] },
  { name: "Travel", route: "travel", keywords: ["travel", "adventure", "explore", "photography", "world"] },
];

function filterCreatorsByCategory(creators: CreatorProfile[], keywords: string[]): CreatorProfile[] {
  return creators.filter(creator => {
    const bio = creator.bio?.toLowerCase() || '';
    const tags = creator.tags?.map(tag => tag.toLowerCase()) || [];
    const allText = bio + ' ' + tags.join(' ');
    
    return keywords.some(keyword => allText.includes(keyword.toLowerCase()));
  });
}

export default function AllCategoriesPage() {
  const navigate = useNavigate();
  const { data: creators = [], isLoading } = useCreators();

  // Filter out AI creators
  const realCreators = creators.filter(creator => {
    const bio = creator.bio?.toLowerCase() || '';
    const tags = creator.tags?.map(tag => tag.toLowerCase()) || [];
    const allText = bio + ' ' + tags.join(' ');
    return !allText.includes('ai generated') && !allText.includes('artificial intelligence');
  });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">All Categories</h1>
            <p className="text-muted-foreground">Discover creators across all categories</p>
          </div>
        </div>

        {/* Categories */}
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading creators...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map(category => {
              const categoryCreators = filterCreatorsByCategory(realCreators, category.keywords);
              
              if (categoryCreators.length === 0) return null;

              return (
                <section key={category.route}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{category.name}</h2>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/explore/${category.route}`)}
                      className="text-sm"
                    >
                      View All ({categoryCreators.length})
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryCreators.slice(0, 8).map((creator) => (
                      <CreatorProfileCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* No creators found */}
        {!isLoading && realCreators.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground">Check back later for new creators!</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}