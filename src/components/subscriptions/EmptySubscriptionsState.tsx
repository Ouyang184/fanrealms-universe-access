
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptySubscriptionsStateProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function EmptySubscriptionsState({ onRefresh, isRefreshing }: EmptySubscriptionsStateProps) {
  return (
    <Card className="w-full p-6">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-16 w-16 mb-4 text-muted-foreground" />
        <h3 className="text-xl font-medium mb-2">No Active Subscriptions</h3>
        <p className="text-muted-foreground mb-6">
          You haven't subscribed to any creators yet.
          Start following creators to see their content here!
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/explore">Explore Creators</Link>
          </Button>
          <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Check Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
