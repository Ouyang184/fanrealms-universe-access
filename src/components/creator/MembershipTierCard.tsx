
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
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
  onSubscriptionSuccess?: () => void;
}

export function MembershipTierCard({ 
  tier, 
  creatorId, 
  isSubscribed,
  onSubscriptionSuccess 
}: MembershipTierCardProps) {
  const getBadgeIcon = (tierName: string) => {
    const name = tierName.toLowerCase();
    if (name.includes('premium') || name.includes('pro')) {
      return <Star className="h-3 w-3" />;
    }
    return <Check className="h-3 w-3" />;
  };

  return (
    <Card className={`relative ${isSubscribed ? 'ring-2 ring-primary' : ''}`}>
      {isSubscribed && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            Subscribed
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
        />
      </CardFooter>
    </Card>
  );
}
