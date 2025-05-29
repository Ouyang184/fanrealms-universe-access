
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Loader2, AlertTriangle, Calendar, RotateCcw } from "lucide-react";
import { SubscribeButton } from "./SubscribeButton";

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  subscriberCount: number;
}

interface MembershipTierCardProps {
  tier: MembershipTier;
  creatorId: string;
  isSubscribed: boolean;
  subscriptionData?: any;
  onSubscriptionSuccess?: () => void;
}

export function MembershipTierCard({ 
  tier, 
  creatorId, 
  isSubscribed,
  subscriptionData,
  onSubscriptionSuccess 
}: MembershipTierCardProps) {
  const getBadgeIcon = (tierName: string) => {
    const name = tierName.toLowerCase();
    if (name.includes('premium') || name.includes('pro')) {
      return <Star className="h-3 w-3" />;
    }
    return <Check className="h-3 w-3" />;
  };

  // Check if subscription is scheduled to cancel
  const isCancellingState = subscriptionData?.status === 'cancelling' || subscriptionData?.cancel_at_period_end;
  const cancelAt = subscriptionData?.cancel_at || subscriptionData?.current_period_end;

  const formatCancelDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className={`relative ${isSubscribed ? 'ring-2 ring-primary' : ''}`}>
      {isSubscribed && !isCancellingState && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            You are subscribed
          </Badge>
        </div>
      )}

      {isSubscribed && isCancellingState && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Ending soon
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getBadgeIcon(tier.name)}
            <CardTitle className="text-xl">{tier.name}</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${tier.price}</div>
            <div className="text-sm text-muted-foreground">/month</div>
          </div>
        </div>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subscribers</span>
            <Badge variant="outline">{tier.subscriberCount || 0}</Badge>
          </div>

          {/* Show cancellation warning if subscription is scheduled to end */}
          {isSubscribed && isCancellingState && cancelAt && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 text-sm">Subscription will end on {formatCancelDate(cancelAt)}</span>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-300">
                  <Calendar className="mr-1 h-3 w-3" />
                  Active until {formatCancelDate(cancelAt)}
                </Badge>
              </div>
            </div>
          )}
          
          <ul className="space-y-2">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <SubscribeButton
          tierId={tier.id}
          creatorId={creatorId}
          tierName={tier.name}
          price={tier.price}
          isSubscribed={isSubscribed}
          subscriptionData={subscriptionData}
          onSubscriptionSuccess={onSubscriptionSuccess}
        />
      </CardFooter>
    </Card>
  );
}
