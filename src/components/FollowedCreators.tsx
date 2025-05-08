
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarSeparator } from "@/components/ui/sidebar";

interface FollowedCreatorsProps {
  isCollapsed?: boolean;
}

export function FollowedCreators({ isCollapsed = false }: FollowedCreatorsProps) {
  const creators = [
    { id: 1, name: "Jessica Smith", username: "jesssmith", avatar: "/placeholder.svg" },
    { id: 2, name: "Michael Lee", username: "mikelee", avatar: "/placeholder.svg" },
    { id: 3, name: "Sarah Johnson", username: "sarahj", avatar: "/placeholder.svg" },
  ];

  if (creators.length === 0) return null;

  return (
    <div className="mt-6">
      {!isCollapsed && (
        <h3 className="px-4 text-sm font-semibold text-muted-foreground mb-2">
          Following
        </h3>
      )}
      <div className="space-y-1">
        {creators.map((creator) => (
          <Link
            key={creator.id}
            to={`/creator/${creator.username}`}
            className={cn(
              "flex items-center py-2 hover:bg-primary/10 rounded-md transition-colors",
              isCollapsed ? "justify-center px-2" : "px-4"
            )}
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={creator.avatar} alt={creator.name} />
              <AvatarFallback>
                {creator.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <span className="ml-3 text-sm truncate">{creator.name}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
