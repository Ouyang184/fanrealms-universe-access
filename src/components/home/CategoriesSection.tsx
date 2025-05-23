
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Category {
  name: string;
  icon: string;
  color: string;
  route: string;
}

export function CategoriesSection() {
  const navigate = useNavigate();
  
  const categories: Category[] = [
    { name: "Art & Illustration", icon: "🎨", color: "from-purple-600 to-pink-600", route: "art-illustration" },
    { name: "Gaming", icon: "🎮", color: "from-blue-600 to-cyan-600", route: "gaming" },
    { name: "Music", icon: "🎵", color: "from-green-600 to-teal-600", route: "music" },
    { name: "Writing", icon: "✍️", color: "from-yellow-600 to-amber-600", route: "writing" },
    { name: "Photography", icon: "📷", color: "from-red-600 to-orange-600", route: "photography" },
    { name: "Education", icon: "📚", color: "from-indigo-600 to-violet-600", route: "education" },
  ];

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
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
