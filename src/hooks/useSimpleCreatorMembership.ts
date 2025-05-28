
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useCallback } from 'react';

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  subscriberCount: number;
}

export const useSimpleCreatorMembership = (creatorId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch membership tiers
  const { data: tiers, isLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['simple-creator-tiers', creatorId],
    queryFn: async () => {
      const { data: tiersData, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId)
        .order('price', { ascending: true });

      if (error) throw error;

      // Get subscriber counts
      const tiersWithCounts = await Promise.all(
        tiersData.map(async (tier) => {
          const { data: subscriptions } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('tier_id', tier.id)
            .eq('status', 'active');

          return {
            id: tier.id,
            name: tier.title,
            price: tier.price,
            description: tier.description || '',
            features: tier.description ? tier.description.split('|') : [],
            subscriberCount: subscriptions?.length || 0,
          };
        })
      );

      return tiersWithCounts;
    },
    enabled: !!creatorId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Get user subscriptions for this creator
  const { data: userSubscriptions, refetch: refetchUserSubscriptions } = useQuery({
    queryKey: ['simple-user-creator-subscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 30000,
  });

  // Check if user is subscribed to a specific tier
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    return userSubscriptions?.some(sub => sub.tier_id === tierId) || false;
  }, [userSubscriptions]);

  // Handle subscription success
  const handleSubscriptionSuccess = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['simple-creator-tiers'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-user-creator-subscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-user-subscriptions'] }),
      refetchTiers(),
      refetchUserSubscriptions(),
    ]);
  }, [queryClient, refetchTiers, refetchUserSubscriptions]);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      if (event.detail?.creatorId === creatorId) {
        await handleSubscriptionSuccess();
      }
    };

    const events = ['subscriptionSuccess', 'paymentSuccess', 'subscriptionCancelled'];
    events.forEach(eventType => {
      window.addEventListener(eventType, handleSubscriptionEvent as EventListener);
    });
    
    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleSubscriptionEvent as EventListener);
      });
    };
  }, [creatorId, handleSubscriptionSuccess]);

  return {
    tiers,
    isLoading,
    isSubscribedToTier,
    handleSubscriptionSuccess,
  };
};
