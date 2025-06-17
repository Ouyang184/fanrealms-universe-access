
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedSidebarProps {
  followedCreators: any[];
  hasFollowedCreators: boolean;
}

export const FeedSidebar: React.FC<FeedSidebarProps> = ({ 
  followedCreators, 
  hasFollowedCreators 
}) => {
  return (
    <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b-2 border-primary">
          MY CREATORS
        </h2>
        {hasFollowedCreators ? (
          <div className="space-y-3">
            {followedCreators.map((creator) => (
              <div key={creator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Avatar className="h-10 w-10 ring-2 ring-muted">
                  <AvatarImage 
                    src={creator.profile_image_url || creator.avatar_url || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"} 
                    alt={creator.display_name || creator.username || "Creator"} 
                  />
                  <AvatarFallback className="text-sm">
                    {(creator.display_name || creator.username || "C").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {creator.display_name || creator.username}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {creator.bio || "Creator"}
                  </p>
                </div>
              </div>
            ))}
            <Button 
              variant="link" 
              className="text-primary text-sm p-0 h-auto mt-4"
            >
              Manage my subscriptions
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No creators followed yet
            </p>
            <Button size="sm">Discover Creators</Button>
          </div>
        )}
      </div>
    </div>
  );
};
