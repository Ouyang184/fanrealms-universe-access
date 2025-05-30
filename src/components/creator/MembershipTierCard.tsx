
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, AlertTriangle, Calendar } from "lucide-react";
import { SimpleSubscribeButton } from "./buttons/SimpleSubscribeButton";

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
  currentSubscription?: any;
  onSubscriptionSuccess?: () => void;
}

export function MembershipTierCard({ 
  tier, 
  creatorId, 
  isSubscribed,
  subscriptionData,
  currentSubscription,
  onSubscriptionSuccess 
}: MembershipTierCardProps) {
  const getBadgeIcon = (tierName: string) => {
    const name = tierName.toLowerCase();
    if (name.includes('premium') || name.includes('pro')) {
      return <Star className="h-3 w-3" />;
    }
    return <Check className="h-3 w-3" />;
  };

  // Use the improved subscription logic
  const isActive = subscriptionData?.status === 'active';
  const isScheduledToCancel = subscriptionData?.cancel_at_period_end === true &&
                             subscriptionData?.current_period_end && 
                             new Date(subscriptionData.current_period_end * 1000) > new Date();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className={`relative ${isSubscribed ? 'ring-2 ring-primary' : ''}`}>
      {isActive && !isScheduledToCancel && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            You are subscribed
          </Badge>
        </div>
      )}

      {isActive && isScheduledToCancel && (
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

          {/* Show subscription status using improved logic */}
          {isActive && isScheduledToCancel && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 text-sm">
                  Subscription will end on {formatDate(subscriptionData.current_period_end)}
                </span>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-300">
                  <Calendar className="mr-1 h-3 w-3" />
                  Active until {formatDate(subscriptionData.current_period_end)}
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
        <SimpleSubscribeButton
          tierId={tier.id}
          creatorId={creatorId}
          tierName={tier.name}
          price={tier.price}
          currentSubscription={currentSubscription}
        />
      </CardFooter>
    </Card>
  );
}
