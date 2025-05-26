
import React from "react";
import { CreatorProfile } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCreatorMembership } from "@/hooks/useCreatorMembership";
import { MembershipTierCard } from "./MembershipTierCard";
import { MembershipEmptyState } from "./MembershipEmptyState";

interface CreatorMembershipProps {
  creator: CreatorProfile;
}

export function CreatorMembership({ creator }: CreatorMembershipProps) {
  const {
    tiers,
    isLoading,
    isSubscribedToTier,
    handleSubscriptionSuccess
  } = useCreatorMembership(creator.id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <h3 className="text-xl font-semibold mb-2">Membership Tiers</h3>
      <p className="text-muted-foreground mb-6">Join this creator's community to unlock exclusive content and perks.</p>
      
      {tiers && tiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {tiers.map(tier => (
            <MembershipTierCard
              key={tier.id}
              tier={tier}
              creatorId={creator.id}
              isSubscribed={isSubscribedToTier(tier.id)}
              onSubscriptionSuccess={handleSubscriptionSuccess}
            />
          ))}
        </div>
      ) : (
        <MembershipEmptyState />
      )}
    </div>
  );
}
