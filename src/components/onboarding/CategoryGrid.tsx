import { Check, Palette, Gamepad2, Music, PenTool, Camera, BookOpen, Mic, ChefHat, Dumbbell, Code2, Shirt, Film, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

const categories: { id: number; name: string; Icon: LucideIcon; route: string }[] = [
  { id: 1, name: "Art & Illustration", Icon: Palette, route: "art-illustration" },
  { id: 2, name: "Gaming", Icon: Gamepad2, route: "gaming" },
  { id: 3, name: "Music", Icon: Music, route: "music" },
  { id: 4, name: "Writing", Icon: PenTool, route: "writing" },
  { id: 5, name: "Photography", Icon: Camera, route: "photography" },
  { id: 6, name: "Education", Icon: BookOpen, route: "education" },
  { id: 7, name: "Podcasts", Icon: Mic, route: "podcasts" },
  { id: 8, name: "Cooking", Icon: ChefHat, route: "cooking" },
  { id: 9, name: "Fitness", Icon: Dumbbell, route: "fitness" },
  { id: 10, name: "Technology", Icon: Code2, route: "technology" },
  { id: 11, name: "Fashion", Icon: Shirt, route: "fashion" },
  { id: 12, name: "Film & Video", Icon: Film, route: "film-video" },
];

interface CategoryGridProps {
  selectedCategories: number[];
  onToggle: (id: number) => void;
  linkToCategory?: boolean;
}

export function CategoryGrid({ selectedCategories, onToggle, linkToCategory = false }: CategoryGridProps) {
  const renderCategory = (category: { id: number; name: string; Icon: LucideIcon; route: string }) => {
    const isSelected = selectedCategories.includes(category.id);
    const { Icon } = category;

    const categoryContent = (
      <>
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">{category.name}</span>
        </div>
      </>
    );

    const categoryClasses = `relative p-4 rounded-xl border cursor-pointer transition-all ${
      isSelected
        ? "bg-primary/10 border-primary"
        : "bg-card border-border hover:border-primary/50"
    }`;

    if (linkToCategory) {
      return (
        <Link key={category.id} to={`/explore/${category.route}`} className={categoryClasses}>
          {categoryContent}
        </Link>
      );
    }

    return (
      <div key={category.id} className={categoryClasses} onClick={() => onToggle(category.id)}>
        {categoryContent}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {categories.map(renderCategory)}
    </div>
  );
}
