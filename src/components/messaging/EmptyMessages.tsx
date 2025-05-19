
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export const EmptyMessages: React.FC = () => {
  return (
    <div className="text-center py-16">
      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-2xl font-semibold mb-2">No messages yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        You don't have any messages yet. Follow creators to start conversations and receive messages.
      </p>
      <Button asChild>
        <Link to="/explore">Discover Creators</Link>
      </Button>
    </div>
  );
};
