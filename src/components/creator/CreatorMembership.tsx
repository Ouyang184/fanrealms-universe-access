
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MembershipTierCard } from "./MembershipTierCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleSubscriptions } from "@/hooks/useSimpleSubscriptions";
import LoadingSpinner from "@/components/LoadingSpinner";

export function CreatorMembership() {
  const { creatorId } = useParams();
  const { user } = useAuth();
  const { userSubscriptions, refreshSubscriptions } = useSimpleSubscriptions();

  // Get creator's membership tiers
  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: ['membership-tiers', creatorId],
    queryFn: async () => {
      if (!creatorId) return [];
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId)
        .order('price', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!creatorId
  });

  // Get subscriber counts for each tier
  const { data: subscriberCounts } = useQuery({
    queryKey: ['tier-subscriber-counts', creatorId],
    queryFn: async () => {
      if (!creatorId || !tiers) return {};
      
      const counts: Record<string, number> = {};
      
      for (const tier of tiers) {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('id', { count: 'exact' })
          .eq('tier_id', tier.id)
          .eq('status', 'active');
          
        counts[tier.id] = data?.length || 0;
      }
      
      return counts;
    },
    enabled: !!creatorId && !!tiers
  });

  // Find user's current subscription to this creator
  const currentSubscription = userSubscriptions?.find(sub => sub.creator_id === creatorId);

  if (tiersLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tiers || tiers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membership Tiers</CardTitle>
          <CardDescription>
            This creator hasn't set up any membership tiers yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSubscriptionSuccess = () => {
    refreshSubscriptions();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Membership Tiers</h2>
        <p className="text-muted-foreground">
          Choose a membership tier to support this creator and unlock exclusive content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const tierData = {
            id: tier.id,
            name: tier.title,
            price: tier.price,
            description: tier.description || '',
            features: tier.description ? [tier.description] : [],
            subscriberCount: subscriberCounts?.[tier.id] || 0
          };

          const isSubscribed = currentSubscription?.tier_id === tier.id;
          const subscriptionData = isSubscribed ? currentSubscription : null;

          return (
            <MembershipTierCard
              key={tier.id}
              tier={tierData}
              creatorId={creatorId!}
              isSubscribed={isSubscribed}
              subscriptionData={subscriptionData}
              currentSubscription={currentSubscription}
              onSubscriptionSuccess={handleSubscriptionSuccess}
            />
          );
        })}
      </div>
    </div>
  );
}
