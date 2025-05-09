
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark } from "lucide-react";

export const FeedEmpty: React.FC = () => {
  return (
    <div className="text-center py-12">
      <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-xl font-medium mb-2">No saved posts yet</h3>
      <p className="text-muted-foreground mb-6">
        When you save posts from your feed, they'll appear here for easy access later.
      </p>
      <Button>Browse Your Feed</Button>
    </div>
  );
};
