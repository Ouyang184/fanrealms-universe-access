
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import { getTierColor } from "@/utils/tierColors";
import { SwitchTierButton } from "./SwitchTierButton";

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
  isSubscribed: boolean;
  currentSubscription?: any;
  creatorId: string;
  onSubscribe: (tierId: string) => void;
  onSwitchSuccess: () => void;
}

export function MembershipTierCard({ 
  tier, 
  isSubscribed, 
  currentSubscription,
  creatorId,
  onSubscribe,
  onSwitchSuccess
}: MembershipTierCardProps) {
  const hasActiveSubscription = !!currentSubscription;
  const isCurrentTier = currentSubscription?.tier_id === tier.id;

  return (
    <Card className={`relative ${isCurrentTier ? 'ring-2 ring-primary shadow-lg' : ''}`}>
      {isCurrentTier && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Current Plan
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CardTitle className="text-xl">{tier.name}</CardTitle>
          <Badge className={getTierColor(tier.name)}>
            ${tier.price}/mo
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {tier.subscriberCount} subscriber{tier.subscriberCount !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{tier.description}</p>
        
        {tier.features.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Features:</h4>
            <ul className="space-y-1">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {isCurrentTier ? (
          <Button disabled className="w-full" variant="default">
            <Crown className="mr-2 h-4 w-4" />
            Current Plan
          </Button>
        ) : hasActiveSubscription ? (
          <SwitchTierButton
            tierId={tier.id}
            tierTitle={tier.name}
            tierPrice={tier.price}
            creatorId={creatorId}
            currentSubscription={currentSubscription}
            onSuccess={onSwitchSuccess}
          />
        ) : (
          <Button 
            onClick={() => onSubscribe(tier.id)}
            className="w-full"
          >
            Subscribe for ${tier.price}/month
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
