
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { CategoryGrid } from "@/components/onboarding/CategoryGrid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export function ExploreCategories() {
  const navigate = useNavigate();

  const handleCategorySelect = (category: string) => {
    console.log('Category selected:', category);
    if (category === "all") {
      console.log('Navigating to /explore/all');
      navigate("/explore/all");
    } else {
      console.log('Navigating to /explore with category:', category);
      navigate(`/explore?category=${category}`);
    }
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Browse Categories</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Content Type
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700 z-50">
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault();
                handleCategorySelect("all");
              }}
              className="cursor-pointer"
            >
              All Categories
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleCategorySelect("art-illustration")}>
              Art & Illustration
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("gaming")}>
              Gaming
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("music")}>
              Music
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("writing")}>
              Writing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("photography")}>
              Photography
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("education")}>
              Education
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("podcasts")}>
              Podcasts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("cooking")}>
              Cooking
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("fitness")}>
              Fitness
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("technology")}>
              Technology
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("fashion")}>
              Fashion
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCategorySelect("film-video")}>
              Film & Video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Use the CategoryGrid component */}
      <CategoryGrid 
        selectedCategories={[]} 
        onToggle={() => {}} 
        linkToCategory={true} 
      />
    </section>
  );
}
