import { Link } from "react-router-dom";
import {
  Palette,
  Gamepad2,
  Music,
  PenTool,
  Camera,
  BookOpen,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  name: string;
  route: string;
  Icon: LucideIcon;
}

const categories: Category[] = [
  { name: "Art & Illustration", route: "art-illustration", Icon: Palette },
  { name: "Gaming", route: "gaming", Icon: Gamepad2 },
  { name: "Music", route: "music", Icon: Music },
  { name: "Writing", route: "writing", Icon: PenTool },
  { name: "Photography", route: "photography", Icon: Camera },
  { name: "Education", route: "education", Icon: BookOpen },
];

export function CategoriesSection() {
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Browse by category</h2>
        <Link to="/explore">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map(({ name, route, Icon }) => (
          <Link
            key={route}
            to={`/explore/${route}`}
            className="group flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold leading-tight">{name}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
