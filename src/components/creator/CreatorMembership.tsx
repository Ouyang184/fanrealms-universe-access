
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreatorProfile } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";

interface CreatorMembershipProps {
  creator: CreatorProfile;
}

export function CreatorMembership({ creator }: CreatorMembershipProps) {
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
      
      // Count subscribers for each tier
      const tiersWithSubscribers = await Promise.all(tiersData.map(async (tier) => {
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('tier_id', tier.id);
          
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
    enabled: !!creator.id
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
          {tiers.map(tier => (
            <div key={tier.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
              
              <Button className="w-full mt-4" variant="default">
                Subscribe
              </Button>
            </div>
          ))}
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
