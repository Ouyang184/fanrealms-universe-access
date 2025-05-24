
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarSeparator } from "@/components/ui/sidebar";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useCreators } from "@/hooks/useCreators";
import { useAuth } from "@/contexts/AuthContext";

interface FollowedCreatorsProps {
  isCollapsed?: boolean;
}

export function FollowedCreators({ isCollapsed = false }: FollowedCreatorsProps) {
  const { user } = useAuth();
  const { subscriptions, loadingSubscriptions, refetch: refetchSubscriptions } = useSubscriptions();
  const { data: creators, refetch: refetchCreators } = useCreators();
  const [followedCreators, setFollowedCreators] = useState<any[]>([]);
  
  // Refetch data periodically to ensure fresh state
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) {
        refetchSubscriptions();
        refetchCreators();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user?.id, refetchSubscriptions, refetchCreators]);
  
  useEffect(() => {
    if (!loadingSubscriptions && subscriptions && creators) {
      // Get followed creator IDs
      const followedCreatorIds = subscriptions.map(sub => sub.creator_id).filter(Boolean);
      
      // Filter creators to get the followed ones with full data
      const followedCreatorsData = creators
        .filter(creator => followedCreatorIds.includes(creator.id))
        .map(creator => ({
          id: creator.id,
          name: creator.display_name || creator.username || 'Creator',
          username: creator.username || 'creator',
          avatar: creator.avatar_url || creator.profile_image_url || "/placeholder.svg"
        }));
      
      setFollowedCreators(followedCreatorsData);
    }
  }, [subscriptions, loadingSubscriptions, creators]);

  if (loadingSubscriptions) {
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
              <AvatarImage src={creator.avatar} alt={creator.name} />
              <AvatarFallback>
                {creator.name
                  .split(" ")
                  .map((n: string) => n[0])
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
