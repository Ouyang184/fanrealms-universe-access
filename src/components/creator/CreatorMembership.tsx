
import React from "react";
import { CreatorProfile } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSimpleCreatorMembership } from "@/hooks/useSimpleCreatorMembership";
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
  } = useSimpleCreatorMembership(creator.id);

  console.log('[CreatorMembership] Render state:', {
    creatorId: creator.id,
    tiersCount: tiers?.length || 0,
    isLoading,
    tiers: tiers?.map(t => ({ 
      id: t.id, 
      name: t.name, 
      isSubscribed: isSubscribedToTier(t.id),
      subscriberCount: t.subscriberCount
    }))
  });

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
          {tiers.map(tier => {
            const isSubscribed = isSubscribedToTier(tier.id);
            console.log(`[CreatorMembership] Tier ${tier.name} (${tier.id}):`, {
              isSubscribed,
              subscriberCount: tier.subscriberCount
            });
            
            return (
              <MembershipTierCard
                key={tier.id}
                tier={tier}
                creatorId={creator.id}
                isSubscribed={isSubscribed}
                onSubscriptionSuccess={handleSubscriptionSuccess}
              />
            );
          })}
        </div>
      ) : (
        <MembershipEmptyState />
      )}
    </div>
  );
}
