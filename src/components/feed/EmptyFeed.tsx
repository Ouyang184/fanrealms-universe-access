
import React from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

export const EmptyFeed: React.FC = () => {
  return (
    <div className="text-center py-16">
      <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-2xl font-semibold mb-2">Your feed is empty</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Follow some creators to see their posts in your feed. Discover new creators and start building your personalized feed.
      </p>
      <Button asChild>
        <Link to="/explore">Discover Creators</Link>
      </Button>
    </div>
  );
};
