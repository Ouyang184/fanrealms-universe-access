
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

// Sample categories for onboarding
const categories = [
  { id: 1, name: "Art & Illustration", icon: "🎨", selected: false, route: "art-illustration" },
  { id: 2, name: "Gaming", icon: "🎮", selected: false, route: "gaming" },
  { id: 3, name: "Music", icon: "🎵", selected: false, route: "music" },
  { id: 4, name: "Writing", icon: "✍️", selected: false, route: "writing" },
  { id: 5, name: "Photography", icon: "📷", selected: false, route: "photography" },
  { id: 6, name: "Education", icon: "📚", selected: false, route: "education" },
  { id: 7, name: "Podcasts", icon: "🎙️", selected: false, route: "podcasts" },
  { id: 8, name: "Cooking", icon: "🍳", selected: false, route: "cooking" },
  { id: 9, name: "Fitness", icon: "💪", selected: false, route: "fitness" },
  { id: 10, name: "Technology", icon: "💻", selected: false, route: "technology" },
  { id: 11, name: "Fashion", icon: "👗", selected: false, route: "fashion" },
  { id: 12, name: "Film & Video", icon: "🎬", selected: false, route: "film-video" },
];

interface CategoryGridProps {
  selectedCategories: number[];
  onToggle: (id: number) => void;
  linkToCategory?: boolean;
}

export function CategoryGrid({ selectedCategories, onToggle, linkToCategory = false }: CategoryGridProps) {
  const renderCategory = (category: { id: number; name: string; icon: string; route: string }) => {
    const isSelected = selectedCategories.includes(category.id);
    
    const categoryContent = (
      <>
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
            <Check className="h-3 w-3" />
          </div>
        )}
        <div className="flex flex-col items-center text-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          <span className="text-sm font-medium">{category.name}</span>
        </div>
      </>
    );

    const categoryClasses = `
      relative p-4 rounded-lg border cursor-pointer transition-all
      ${
        isSelected
          ? "bg-primary/10 border-primary"
          : "bg-gray-800 border-gray-700 hover:border-gray-600"
      }
    `;

    // If linkToCategory is true, render as Link, otherwise as a div with onClick
    if (linkToCategory) {
      return (
        <Link
          key={category.id}
          to={`/explore/${category.route}`}
          className={categoryClasses}
        >
          {categoryContent}
        </Link>
      );
    }

    return (
      <div
        key={category.id}
        className={categoryClasses}
        onClick={() => onToggle(category.id)}
      >
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
