
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  subscriberCount: number;
}

export const useCreatorMembership = (creatorId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localSubscriptionStates, setLocalSubscriptionStates] = useState<Record<string, boolean>>({});

  // Fetch membership tiers with real-time subscriber counts
  const { data: tiers, isLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['creatorMembershipTiers', creatorId],
    queryFn: async () => {
      console.log('Fetching membership tiers for creator:', creatorId);
      
      const { data: tiersData, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId)
        .order('price', { ascending: true });

      if (tiersError) throw tiersError;

      // Get subscriber counts for each tier
      const tiersWithCounts = await Promise.all(
        tiersData.map(async (tier) => {
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
            description: tier.description || '',
            features: tier.description ? tier.description.split('|') : [],
            subscriberCount: count || 0,
          };
        })
      );

      console.log('Fetched tiers with subscriber counts:', tiersWithCounts);
      return tiersWithCounts;
    },
    enabled: !!creatorId,
    staleTime: 0,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

  // Fetch user's subscriptions to check which tiers they're subscribed to
  const { data: userSubscriptions, refetch: refetchUserSubscriptions } = useQuery({
    queryKey: ['userCreatorSubscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching user subscriptions for creator:', creatorId);
      
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select('tier_id, status')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user subscriptions:', error);
        return [];
      }

      console.log('User subscriptions for creator:', data);
      return data;
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 0,
    refetchInterval: 1000, // Very frequent updates for subscription state
  });

  // Check if user is subscribed to a specific tier
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    // Check local state first for immediate updates
    if (localSubscriptionStates[tierId] !== undefined) {
      return localSubscriptionStates[tierId];
    }
    
    // Fall back to server data
    return userSubscriptions?.some(sub => sub.tier_id === tierId && sub.status === 'active') || false;
  }, [userSubscriptions, localSubscriptionStates]);

  // Handle subscription success with optimistic updates
  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('Subscription success detected, refreshing data...');
    
    // Invalidate all related queries immediately
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
      queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
    ]);

    // Force immediate refetch
    await Promise.all([
      refetchTiers(),
      refetchUserSubscriptions(),
    ]);
  }, [queryClient, refetchTiers, refetchUserSubscriptions]);

  // Update local subscription state optimistically
  const updateLocalSubscriptionState = useCallback((tierId: string, isSubscribed: boolean) => {
    setLocalSubscriptionStates(prev => ({
      ...prev,
      [tierId]: isSubscribed
    }));
    
    // Clear local state after a delay to let server data take over
    setTimeout(() => {
      setLocalSubscriptionStates(prev => {
        const newState = { ...prev };
        delete newState[tierId];
        return newState;
      });
    }, 5000);
  }, []);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log('Subscription event detected:', event.type, event.detail);
      
      if (event.detail?.creatorId === creatorId) {
        const { tierId } = event.detail;
        
        if (event.type === 'subscriptionSuccess' || event.type === 'paymentSuccess') {
          // Optimistically update local state
          if (tierId) {
            updateLocalSubscriptionState(tierId, true);
          }
        } else if (event.type === 'subscriptionCanceled') {
          if (tierId) {
            updateLocalSubscriptionState(tierId, false);
          }
        }
        
        // Refresh data from server
        await handleSubscriptionSuccess();
      }
    };

    window.addEventListener('subscriptionSuccess', handleSubscriptionEvent as EventListener);
    window.addEventListener('paymentSuccess', handleSubscriptionEvent as EventListener);
    window.addEventListener('subscriptionCanceled', handleSubscriptionEvent as EventListener);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionEvent as EventListener);
      window.removeEventListener('paymentSuccess', handleSubscriptionEvent as EventListener);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionEvent as EventListener);
    };
  }, [creatorId, handleSubscriptionSuccess, updateLocalSubscriptionState]);

  // Set up real-time subscription for database changes
  useEffect(() => {
    if (!creatorId) return;

    console.log('Setting up real-time subscription for creator:', creatorId);
    
    const channel = supabase
      .channel(`membership-updates-${creatorId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'creator_subscriptions',
        filter: `creator_id=eq.${creatorId}`
      }, (payload) => {
        console.log('Real-time update received for creator subscriptions:', payload);
        handleSubscriptionSuccess();
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [creatorId, handleSubscriptionSuccess]);

  return {
    tiers,
    isLoading,
    isSubscribedToTier,
    handleSubscriptionSuccess,
    updateLocalSubscriptionState,
  };
};
