
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { getTierColor } from "@/utils/tierColors";

interface SubscriptionCardProps {
  subscription: any;
  onCancel: (subscriptionId: string) => void;
}

export function SubscriptionCard({ subscription, onCancel }: SubscriptionCardProps) {
  const creator = subscription.creator;
  const tier = subscription.tier;
  const user = creator?.users;
  
  // Use the improved subscription logic
  const isActive = subscription.status === 'active';
  const isScheduledToCancel = subscription.cancel_at_period_end === true &&
                             subscription.current_period_end && 
                             new Date(subscription.current_period_end * 1000) > new Date();
  
  // Format subscription date
  const createdDate = new Date(subscription.created_at);
  const memberSince = createdDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Calculate next billing date based on current period end
  const nextBillingDate = subscription.current_period_end ? 
    new Date(subscription.current_period_end * 1000) : 
    new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000); // fallback to 30 days from creation
  
  const nextBilling = nextBillingDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formatCancelDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="h-32 bg-cover bg-center"
        style={{ backgroundImage: `url(${creator?.banner_url || creator?.profile_image_url || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"})` }}
      />
      <CardContent className="pt-0 -mt-12 p-6">
        <div className="flex justify-between items-start">
          <Avatar className="h-20 w-20 border-4 border-background">
            <AvatarImage
              src={creator?.profile_image_url || user?.profile_picture || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"}
              alt={user?.username || "Creator"}
            />
            <AvatarFallback>
              {(creator?.display_name || user?.username || "C").charAt(0)}
            </AvatarFallback>
          </Avatar>
          {tier && (
            <Badge className={getTierColor(tier.title)}>
              {tier.title || "Free"}
            </Badge>
          )}
        </div>
        <h3 className="text-xl font-semibold mt-4">
          {creator?.display_name || user?.username || "Creator"}
        </h3>
        <p className="text-muted-foreground text-sm mt-1">{creator?.bio || "No bio available"}</p>

        {/* Use improved subscription status logic */}
        {isActive && isScheduledToCancel && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center mb-1">
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800 text-sm">Ending Soon</span>
            </div>
            <p className="text-yellow-700 text-xs">
              Subscription will end on {formatCancelDate(subscription.current_period_end)}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Membership Level</span>
            <span className="font-medium">{tier?.title || "Free"}</span>
          </div>
          {(tier?.price || subscription.amount_paid) && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Payment</span>
              <span className="font-medium">${(tier?.price || subscription.amount_paid || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {isActive && isScheduledToCancel ? 'Ends On' : 'Next Billing Date'}
            </span>
            <span className="font-medium">
              {isActive && isScheduledToCancel ? formatCancelDate(subscription.current_period_end) : nextBilling}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Member Since</span>
            <span className="font-medium">{memberSince}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-medium capitalize ${
              isActive && isScheduledToCancel ? 'text-yellow-600' : 
              isActive ? 'text-green-600' : 'text-gray-600'
            }`}>
              {isActive && isScheduledToCancel ? 'Ending Soon' : 
               isActive ? 'Active' : subscription.status}
            </span>
          </div>
        </div>

        {tier && tier.description && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Tier Benefits</h4>
            <p className="text-sm text-muted-foreground">{tier.description}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Updated {new Date(subscription.updated_at || subscription.created_at).toLocaleDateString()}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {!(isActive && isScheduledToCancel) && <DropdownMenuItem>Change Tier</DropdownMenuItem>}
              <DropdownMenuItem>Message Creator</DropdownMenuItem>
              <DropdownMenuSeparator />
              {!(isActive && isScheduledToCancel) ? (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onCancel(subscription.id)}
                >
                  Cancel Subscription
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-green-600">
                  Reactivate Subscription
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-between">
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to={`/creator/${subscription.creator_id}`}>View Creator Page</Link>
        </Button>
        <Button size="sm">
          View Content
        </Button>
      </CardFooter>
    </Card>
  );
}
