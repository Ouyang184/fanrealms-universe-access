
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Gamepad2, 
  Music, 
  PenTool, 
  Camera, 
  GraduationCap, 
  Headphones, 
  ChefHat, 
  Dumbbell, 
  Code, 
  Shirt, 
  Film,
  Grid3X3
} from "lucide-react";

const categories = [
  { name: "All Categories", icon: Grid3X3, path: "/explore/all", gradient: "from-purple-500 to-pink-500" },
  { name: "Art & Illustration", icon: Palette, path: "/explore/art-illustration", gradient: "from-red-500 to-orange-500" },
  { name: "Gaming", icon: Gamepad2, path: "/explore/gaming", gradient: "from-blue-500 to-purple-500" },
  { name: "Music", icon: Music, path: "/explore/music", gradient: "from-green-500 to-blue-500" },
  { name: "Writing", icon: PenTool, path: "/explore/writing", gradient: "from-yellow-500 to-red-500" },
  { name: "Photography", icon: Camera, path: "/explore/photography", gradient: "from-gray-500 to-blue-500" },
  { name: "Education", icon: GraduationCap, path: "/explore/education", gradient: "from-indigo-500 to-purple-500" },
  { name: "Podcasts", icon: Headphones, path: "/explore/podcasts", gradient: "from-pink-500 to-red-500" },
  { name: "Cooking", icon: ChefHat, path: "/explore/cooking", gradient: "from-orange-500 to-yellow-500" },
  { name: "Fitness", icon: Dumbbell, path: "/explore/fitness", gradient: "from-green-500 to-teal-500" },
  { name: "Technology", icon: Code, path: "/explore/technology", gradient: "from-blue-500 to-cyan-500" },
  { name: "Fashion", icon: Shirt, path: "/explore/fashion", gradient: "from-purple-500 to-pink-500" },
  { name: "Film & Video", icon: Film, path: "/explore/film-video", gradient: "from-red-500 to-purple-500" },
];

export function ExploreCategories() {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {categories.map((category) => (
          <Link key={category.name} to={category.path}>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all group"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-r ${category.gradient} group-hover:scale-110 transition-transform`}>
                <category.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-center leading-tight">{category.name}</span>
            </Button>
          </Link>
        ))}
      </div>
    </section>
  );
}
