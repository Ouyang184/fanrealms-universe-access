
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CreatorProfile } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { SubscribeButton } from "./SubscribeButton";

interface CreatorMembershipProps {
  creator: CreatorProfile;
}

export function CreatorMembership({ creator }: CreatorMembershipProps) {
  const { user } = useAuth();

  // Fetch membership tiers for this creator
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['creatorMembershipTiers', creator.id],
    queryFn: async () => {
      if (!creator.id) return [];
      
      const { data: tiersData, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creator.id)
        .order('price', { ascending: true });
      
      if (error) {
        console.error('Error fetching tiers:', error);
        return [];
      }
      
      // Count subscribers for each tier using creator_subscriptions table
      const tiersWithSubscribers = await Promise.all(tiersData.map(async (tier) => {
        const { count, error: countError } = await supabase
          .from('creator_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('tier_id', tier.id)
          .eq('status', 'active');

        if (countError) {
          console.error('Error counting subscribers for tier:', tier.id, countError);
        }
          
        return {
          id: tier.id,
          name: tier.title,
          price: tier.price,
          description: tier.description,
          features: tier.description ? [tier.description] : ['Access to exclusive content'],
          subscriberCount: count || 0
        };
      }));
      
      return tiersWithSubscribers;
    },
    enabled: !!creator.id,
    refetchInterval: 10000, // Refetch every 10 seconds to get updated counts
  });

  // Check user's current subscriptions to this creator
  const { data: userSubscriptions = [], refetch: refetchSubscriptions } = useQuery({
    queryKey: ['userCreatorSubscriptions', user?.id, creator.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select('tier_id, status, stripe_subscription_id')
        .eq('user_id', user.id)
        .eq('creator_id', creator.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user subscriptions:', error);
        return [];
      }
      
      console.log('User subscriptions for creator:', data);
      return data;
    },
    enabled: !!user?.id && !!creator.id,
    refetchInterval: 5000, // Refetch every 5 seconds to catch new subscriptions
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const isSubscribedToTier = (tierId: string) => {
    const isSubscribed = userSubscriptions.some(sub => sub.tier_id === tierId);
    console.log(`Checking subscription for tier ${tierId}:`, isSubscribed);
    return isSubscribed;
  };

  return (
    <div className="text-center p-8">
      <h3 className="text-xl font-semibold mb-2">Membership Tiers</h3>
      <p className="text-muted-foreground mb-6">Join this creator's community to unlock exclusive content and perks.</p>
      
      {tiers && tiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {tiers.map(tier => {
            const isSubscribed = isSubscribedToTier(tier.id);
            return (
              <div 
                key={tier.id} 
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  isSubscribed ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
                }`}
              >
                {isSubscribed && (
                  <Badge className="mb-2 bg-green-500">
                    Your Plan
                  </Badge>
                )}
                <h4 className="font-medium text-lg">{tier.name}</h4>
                <p className="text-2xl font-bold mt-2 text-primary">${Number(tier.price).toFixed(2)}/mo</p>
                
                <Badge variant="secondary" className="mt-2">
                  {tier.subscriberCount} subscribers
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
                    creatorId={creator.id}
                    tierName={tier.name}
                    price={tier.price}
                    isSubscribed={isSubscribed}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-8">
          <p className="text-muted-foreground">This creator has not set up any membership tiers yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Check back later for exclusive content opportunities!</p>
        </div>
      )}
    </div>
  );
}
