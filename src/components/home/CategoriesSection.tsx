
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatorProfile } from "@/types";

interface Category {
  name: string;
  icon: string;
  color: string;
  route: string;
}

export function CategoriesSection() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [creatorsByCategory, setCreatorsByCategory] = useState<Record<string, number>>({});
  
  const categories: Category[] = [
    { name: "Art & Illustration", icon: "🎨", color: "from-purple-600 to-pink-600", route: "art-illustration" },
    { name: "Gaming", icon: "🎮", color: "from-blue-600 to-cyan-600", route: "gaming" },
    { name: "Music", icon: "🎵", color: "from-green-600 to-teal-600", route: "music" },
    { name: "Writing", icon: "✍️", color: "from-yellow-600 to-amber-600", route: "writing" },
    { name: "Photography", icon: "📷", color: "from-red-600 to-orange-600", route: "photography" },
    { name: "Education", icon: "📚", color: "from-indigo-600 to-violet-600", route: "education" },
  ];

  // Fetch real creators and count them by category
  useEffect(() => {
    async function fetchCreators() {
      try {
        setIsLoading(true);
        
        // Fetch real creators (non-AI)
        const { data: creators, error } = await supabase
          .from('creators')
          .select(`
            *,
            users!creators_user_id_fkey (
              username,
              profile_picture
            )
          `)
          .eq('is_ai', false)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching creators:", error);
          return;
        }

        // Count creators by category based on bio content or tags
        const categoryCreatorCount: Record<string, number> = {};
        
        // Initialize all categories with 0
        categories.forEach(cat => {
          categoryCreatorCount[cat.route] = 0;
        });
        
        // Count creators by matching their bio or tags with categories
        creators.forEach((creator: any) => {
          const bio = (creator.bio || "").toLowerCase();
          const tags = (creator.tags || []).map((tag: string) => tag.toLowerCase());
          
          categories.forEach(category => {
            const categoryName = category.name.toLowerCase();
            const categoryRoute = category.route.toLowerCase();
            
            // Check if bio contains category keywords
            if (bio.includes(categoryName) || 
                categoryName.split(' ').some(word => bio.includes(word)) ||
                tags.some(tag => tag.includes(categoryName) || categoryName.includes(tag))) {
              categoryCreatorCount[categoryRoute] = (categoryCreatorCount[categoryRoute] || 0) + 1;
            }
            
            // Fallback category matching based on content similarity
            if (categoryRoute === 'art-illustration' && 
                (bio.includes('art') || bio.includes('draw') || bio.includes('paint') || bio.includes('illustrat'))) {
              categoryCreatorCount['art-illustration'] = (categoryCreatorCount['art-illustration'] || 0) + 1;
            } else if (categoryRoute === 'gaming' && 
                (bio.includes('game') || bio.includes('stream') || bio.includes('play'))) {
              categoryCreatorCount['gaming'] = (categoryCreatorCount['gaming'] || 0) + 1;
            } else if (categoryRoute === 'music' && 
                (bio.includes('music') || bio.includes('song') || bio.includes('audio') || bio.includes('sound'))) {
              categoryCreatorCount['music'] = (categoryCreatorCount['music'] || 0) + 1;
            } else if (categoryRoute === 'writing' && 
                (bio.includes('write') || bio.includes('book') || bio.includes('novel') || bio.includes('blog'))) {
              categoryCreatorCount['writing'] = (categoryCreatorCount['writing'] || 0) + 1;
            } else if (categoryRoute === 'photography' && 
                (bio.includes('photo') || bio.includes('camera') || bio.includes('picture'))) {
              categoryCreatorCount['photography'] = (categoryCreatorCount['photography'] || 0) + 1;
            } else if (categoryRoute === 'education' && 
                (bio.includes('teach') || bio.includes('learn') || bio.includes('tutor') || bio.includes('course'))) {
              categoryCreatorCount['education'] = (categoryCreatorCount['education'] || 0) + 1;
            }
          });
        });
        
        setCreatorsByCategory(categoryCreatorCount);
      } catch (error) {
        console.error("Error processing creators:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCreators();
  }, []);

  const handleCategoryClick = (route: string) => {
    navigate(`/explore/${route}`);
  };

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

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Skeleton className="h-12 w-12 rounded-full mb-3" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, i) => (
            <Card
              key={i}
              className="bg-gray-900 border-gray-800 overflow-hidden group cursor-pointer hover:border-gray-700 transition-all"
              onClick={() => handleCategoryClick(category.route)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div
                  className={`h-12 w-12 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl mb-3`}
                >
                  {category.icon}
                </div>
                <h3 className="font-medium group-hover:text-purple-400 transition-colors">{category.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {creatorsByCategory[category.route] || 0} creators
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
