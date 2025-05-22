
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

// Sample categories for onboarding
const categories = [
  { id: 1, name: "Art & Illustration", icon: "🎨", selected: false },
  { id: 2, name: "Gaming", icon: "🎮", selected: false },
  { id: 3, name: "Music", icon: "🎵", selected: false },
  { id: 4, name: "Writing", icon: "✍️", selected: false },
  { id: 5, name: "Photography", icon: "📷", selected: false },
  { id: 6, name: "Education", icon: "📚", selected: false },
  { id: 7, name: "Podcasts", icon: "🎙️", selected: false },
  { id: 8, name: "Cooking", icon: "🍳", selected: false },
  { id: 9, name: "Fitness", icon: "💪", selected: false },
  { id: 10, name: "Technology", icon: "💻", selected: false },
  { id: 11, name: "Fashion", icon: "👗", selected: false },
  { id: 12, name: "Film & Video", icon: "🎬", selected: false },
];

interface CategoryGridProps {
  selectedCategories: number[];
  onToggle: (id: number) => void;
  linkToCategory?: boolean;
}

export function CategoryGrid({ selectedCategories, onToggle, linkToCategory = false }: CategoryGridProps) {
  const renderCategory = (category: { id: number; name: string; icon: string }) => {
    const isSelected = selectedCategories.includes(category.id);
    
    const categoryContent = (
      <>
        {isSelected && (
          <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-0.5">
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
          ? "bg-purple-900/30 border-purple-500"
          : "bg-gray-800 border-gray-700 hover:border-gray-600"
      }
    `;

    // If linkToCategory is true, render as Link, otherwise as a div with onClick
    if (linkToCategory) {
      return (
        <Link
          key={category.id}
          to={`/explore?category=${encodeURIComponent(category.name)}`}
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
