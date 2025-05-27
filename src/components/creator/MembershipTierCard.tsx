
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
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
  onSubscriptionSuccess: () => void;
}

export function MembershipTierCard({ 
  tier, 
  creatorId, 
  isSubscribed, 
  onSubscriptionSuccess 
}: MembershipTierCardProps) {
  const [localSubscriberCount, setLocalSubscriberCount] = useState(tier.subscriberCount);
  const [localIsSubscribed, setLocalIsSubscribed] = useState(isSubscribed);

  // Update local state when props change
  useEffect(() => {
    setLocalSubscriberCount(tier.subscriberCount);
    setLocalIsSubscribed(isSubscribed);
  }, [tier.subscriberCount, isSubscribed]);

  // Handle optimistic updates only for successful payments, not subscription attempts
  const handleOptimisticUpdate = (newIsSubscribed: boolean) => {
    const wasSubscribed = localIsSubscribed;
    setLocalIsSubscribed(newIsSubscribed);
    
    // Update subscriber count optimistically only after confirmed payment
    if (newIsSubscribed && !wasSubscribed) {
      // User just subscribed (after payment success)
      setLocalSubscriberCount(prev => prev + 1);
    } else if (!newIsSubscribed && wasSubscribed) {
      // User just unsubscribed
      setLocalSubscriberCount(prev => Math.max(0, prev - 1));
    }
  };

  // Handle subscription success with potential count correction
  const handleSubscriptionSuccess = () => {
    // Call parent callback to refresh data
    onSubscriptionSuccess();
    
    // The real data will update via the parent refresh, so we don't need to do anything else here
  };

  return (
    <div 
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        localIsSubscribed ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
      }`}
    >
      {localIsSubscribed && (
        <Badge className="mb-2 bg-green-500">
          Your Plan
        </Badge>
      )}
      <h4 className="font-medium text-lg">{tier.name}</h4>
      <p className="text-2xl font-bold mt-2 text-primary">${Number(tier.price).toFixed(2)}/mo</p>
      
      <Badge variant="secondary" className="mt-2">
        {localSubscriberCount} subscribers
      </Badge>
      
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
        <ul className="text-sm space-y-1">
          {tier.features.map((feature, i) => (
            <li key={i} className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-4">
        <SubscribeButton
          tierId={tier.id}
          creatorId={creatorId}
          tierName={tier.name}
          price={tier.price}
          isSubscribed={localIsSubscribed}
          onSubscriptionSuccess={handleSubscriptionSuccess}
          onOptimisticUpdate={handleOptimisticUpdate}
        />
      </div>
    </div>
  );
}
