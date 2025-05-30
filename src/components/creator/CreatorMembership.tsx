import React, { useCallback } from 'react';
import { useCreatorMembership } from "@/hooks/useCreatorMembership";
import { MembershipTierCard } from "./MembershipTierCard";
import { Button } from "@/components/ui/button";

interface CreatorMembershipProps {
  creatorId: string;
}

export function CreatorMembership({ creatorId }: CreatorMembershipProps) {
  const { 
    tiers, 
    isLoading, 
    isSubscribedToTier, 
    getSubscriptionData, 
    handleSubscriptionSuccess 
  } = useCreatorMembership(creatorId);

  const handleSubscribe = (tierId: string) => {
    console.log('Subscribing to tier:', tierId);
    // Implement your subscribe logic here
  };

  const handleSwitchSuccess = useCallback(() => {
    console.log('Tier switch successful, refreshing membership data...');
    handleSubscriptionSuccess();
  }, [handleSubscriptionSuccess]);

  if (isLoading) {
    return <div>Loading membership tiers...</div>;
  }

  if (!tiers || tiers.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">No Membership Tiers Yet</h2>
        <p className="text-muted-foreground">
          This creator has not set up any membership tiers. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Membership Tiers</h2>
        <p className="text-muted-foreground">
          Choose a membership tier to support this creator and unlock exclusive content.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiers?.map((tier) => {
          const subscriptionData = getSubscriptionData(tier.id);
          const isSubscribedToThisTier = isSubscribedToTier(tier.id);
          
          return (
            <MembershipTierCard
              key={tier.id}
              tier={tier}
              isSubscribed={isSubscribedToThisTier}
              currentSubscription={subscriptionData}
              creatorId={creatorId}
              onSubscribe={handleSubscribe}
              onSwitchSuccess={handleSwitchSuccess}
            />
          );
        })}
      </div>

      {/* Conditional rendering for no tiers */}
      {tiers && tiers.length === 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-2">No Membership Tiers Yet</h2>
          <p className="text-muted-foreground">
            This creator has not set up any membership tiers. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
