
import React from "react";
import { MembershipTierCard } from "./MembershipTierCard";
import { MembershipEmptyState } from "./MembershipEmptyState";
import { useCreatorMembership } from "@/hooks/useCreatorMembership";
import LoadingSpinner from "@/components/LoadingSpinner";

interface CreatorMembershipProps {
  creatorId: string;
}

export function CreatorMembership({ creatorId }: CreatorMembershipProps) {
  const { 
    tiers, 
    isLoading, 
    isSubscribedToTier, 
    handleSubscriptionSuccess 
  } = useCreatorMembership(creatorId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tiers || tiers.length === 0) {
    return <MembershipEmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Membership Tiers</h2>
        <p className="text-muted-foreground">
          Join this creator's community to unlock exclusive content and perks.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isSubscribed = isSubscribedToTier(tier.id);
          
          return (
            <MembershipTierCard
              key={tier.id}
              tier={tier}
              creatorId={creatorId}
              isSubscribed={isSubscribed}
              onSubscriptionSuccess={handleSubscriptionSuccess}
            />
          );
        })}
      </div>
    </div>
  );
}
