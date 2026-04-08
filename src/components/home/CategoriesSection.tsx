
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCreators } from "@/hooks/useCreators";

interface Category {
  name: string;
  icon: string;
  route: string;
}

export function CategoriesSection() {
  const navigate = useNavigate();
  const { data: creators = [], isLoading } = useCreators();
  const [categoryCreatorCounts, setCategoryCreatorCounts] = useState<Record<string, number>>({});
  
  const categories: Category[] = [
    { name: "Art & Illustration", icon: "🎨", route: "art-illustration" },
    { name: "Gaming", icon: "🎮", route: "gaming" },
    { name: "Music", icon: "🎵", route: "music" },
    { name: "Writing", icon: "✍️", route: "writing" },
    { name: "Photography", icon: "📷", route: "photography" },
    { name: "Education", icon: "📚", route: "education" },
  ];

  useEffect(() => {
    if (!isLoading && creators.length > 0) {
      const counts: Record<string, number> = {};
      const realCreators = creators.filter(creator => {
        const displayName = creator.displayName || creator.display_name || '';
        const bio = creator.bio || '';
        return !displayName.includes('AI') && !bio.includes('AI generated');
      });
      
      realCreators.forEach(creator => {
        const bio = (creator.bio || "").toLowerCase();
        const tags = creator.tags || [];
        
        categories.forEach(category => {
          const categoryName = category.name.toLowerCase();
          const categoryRoute = category.route.toLowerCase();
          const matchesBio = bio.includes(categoryName) || bio.includes(categoryRoute);
          const matchesTags = tags.some(tag => 
            tag.toLowerCase().includes(categoryName) || categoryRoute.includes(tag.toLowerCase())
          );
          if (matchesBio || matchesTags) {
            counts[category.route] = (counts[category.route] || 0) + 1;
          }
        });
      });
      
      categories.forEach(category => {
        counts[category.route] = counts[category.route] || 0;
      });
      setCategoryCreatorCounts(counts);
    }
  }, [creators, isLoading]);

  const handleCategoryClick = (route: string) => {
    navigate(`/explore/${route}`);
  };

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Link to="/explore">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((category, i) => (
          <button
            key={i}
            className="text-left p-4 rounded-lg border border-border hover:border-foreground/20 transition-colors"
            onClick={() => handleCategoryClick(category.route)}
          >
            <span className="text-2xl">{category.icon}</span>
            <h3 className="text-sm font-medium mt-2">{category.name}</h3>
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {categoryCreatorCounts[category.route] || 0} creators
              </p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
