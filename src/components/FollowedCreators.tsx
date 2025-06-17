
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFollows } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";

interface FollowedCreatorsProps {
  isCollapsed?: boolean;
}

export function FollowedCreators({ isCollapsed = false }: FollowedCreatorsProps) {
  const { user } = useAuth();
  const { data: followedCreators = [], isLoading, refetch } = useFollows();
  
  // Refetch data more frequently to ensure fresh creator data
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) {
        refetch();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, refetch]);

  if (isLoading) {
    return null;
  }

  if (followedCreators.length === 0) return null;

  return (
    <div className="mt-6">
      {!isCollapsed && (
        <h3 className="px-4 text-sm font-semibold text-muted-foreground mb-2">
          Following ({followedCreators.length})
        </h3>
      )}
      <div className="space-y-1">
        {followedCreators.map((creator) => (
          <Link
            key={creator.id}
            to={`/creator/${creator.username}`}
            className={cn(
              "flex items-center py-2 hover:bg-primary/10 rounded-md transition-colors",
              isCollapsed ? "justify-center px-2" : "px-4"
            )}
          >
            <Avatar className="h-7 w-7">
              <AvatarImage 
                src={creator.profile_image_url || creator.avatar_url || undefined} 
                alt={creator.display_name || creator.username} 
              />
              <AvatarFallback>
                {(creator.display_name || creator.username || "C")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <span className="ml-3 text-sm truncate">{creator.display_name || creator.username}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
