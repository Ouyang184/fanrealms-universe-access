import { Link } from "react-router-dom";
import {
  Palette,
  Gamepad2,
  Music,
  PenTool,
  Camera,
  BookOpen,
  Mic,
  ChefHat,
  Dumbbell,
  Code2,
  Shirt,
  Film,
  LucideIcon,
} from "lucide-react";

interface Category {
  name: string;
  route: string;
  Icon: LucideIcon;
}

const CATEGORIES: Category[] = [
  { name: "Art & Illustration", route: "art-illustration", Icon: Palette },
  { name: "Gaming", route: "gaming", Icon: Gamepad2 },
  { name: "Music", route: "music", Icon: Music },
  { name: "Writing", route: "writing", Icon: PenTool },
  { name: "Photography", route: "photography", Icon: Camera },
  { name: "Education", route: "education", Icon: BookOpen },
  { name: "Podcasts", route: "podcasts", Icon: Mic },
  { name: "Cooking", route: "cooking", Icon: ChefHat },
  { name: "Fitness", route: "fitness", Icon: Dumbbell },
  { name: "Technology", route: "technology", Icon: Code2 },
  { name: "Fashion", route: "fashion", Icon: Shirt },
  { name: "Film & Video", route: "film-video", Icon: Film },
];

interface CategoryTileGridProps {
  limit?: number;
}

export function CategoryTileGrid({ limit }: CategoryTileGridProps) {
  const items = limit ? CATEGORIES.slice(0, limit) : CATEGORIES;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map(({ name, route, Icon }) => (
        <Link
          key={route}
          to={`/explore/${route}`}
          className="group flex flex-col items-center justify-center text-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold leading-tight">{name}</span>
        </Link>
      ))}
    </div>
  );
}
