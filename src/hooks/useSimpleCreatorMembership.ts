
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

export const useSimpleCreatorMembership = (creatorId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localSubscriptionStates, setLocalSubscriptionStates] = useState<Record<string, boolean>>({});

  // Fetch membership tiers
  const { data: tiers, isLoading: tiersLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['simpleCreatorMembershipTiers', creatorId],
    queryFn: async () => {
      console.log('Fetching membership tiers for creator:', creatorId);
      
      const { data: tiersData, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId)
        .order('price', { ascending: true });

      if (tiersError) throw tiersError;

      // Get subscriber counts for each tier from user_subscriptions table
      const tiersWithCounts = await Promise.all(
        tiersData.map(async (tier) => {
          const { count, error: countError } = await supabase
            .from('user_subscriptions')
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
    refetchInterval: 30000,
  });

  // Get user subscriptions for this creator - using user_subscriptions table consistently
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['simpleUserCreatorSubscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for subscription check');
        return [];
      }
      
      console.log('Checking user subscriptions for user:', user.id, 'creator:', creatorId);
      
      // Query user_subscriptions table with proper status check
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user subscriptions:', error);
        return [];
      }

      console.log('User subscriptions found:', data?.length || 0, data);
      return data || [];
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 0,
    refetchInterval: 30000,
  });

  const isLoading = tiersLoading || subscriptionsLoading;

  // Check if user is subscribed to a specific tier with enhanced logging
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    console.log('isSubscribedToTier called with:', { tierId, userId: user?.id });
    
    // Check local state first for immediate updates
    if (localSubscriptionStates[tierId] !== undefined) {
      console.log('Using local state for tier:', tierId, localSubscriptionStates[tierId]);
      return localSubscriptionStates[tierId];
    }
    
    // Fall back to server data from user_subscriptions table
    const isSubscribed = userSubscriptions?.some(sub => {
      console.log('Checking subscription:', sub, 'against tier:', tierId);
      return sub.tier_id === tierId && sub.status === 'active';
    }) || false;
    
    console.log('isSubscribedToTier final result for tier:', tierId, 'result:', isSubscribed);
    console.log('All user subscriptions:', userSubscriptions);
    
    return isSubscribed;
  }, [userSubscriptions, localSubscriptionStates, user?.id]);

  // Handle subscription success
  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('Subscription success detected, refreshing data...');
    
    // Invalidate all related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['simpleCreatorMembershipTiers'] }),
      queryClient.invalidateQueries({ queryKey: ['simpleUserCreatorSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['subscription-check'] }),
    ]);

    // Force immediate refetch
    await Promise.all([
      refetchTiers(),
      refetchSubscriptions(),
    ]);
  }, [queryClient, refetchTiers, refetchSubscriptions]);

  // Update local subscription state optimistically
  const updateLocalSubscriptionState = useCallback((tierId: string, isSubscribed: boolean) => {
    console.log('Updating local subscription state for tier:', tierId, 'to:', isSubscribed);
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
    }, 10000); // 10 seconds
  }, []);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log('Subscription event detected:', event.type, event.detail);
      
      if (event.detail?.creatorId === creatorId) {
        const { tierId } = event.detail;
        
        if (event.type === 'subscriptionSuccess' || event.type === 'paymentSuccess') {
          if (tierId) {
            updateLocalSubscriptionState(tierId, true);
          }
        } else if (event.type === 'subscriptionCanceled') {
          if (tierId) {
            updateLocalSubscriptionState(tierId, false);
          }
        }
        
        // Always perform full refresh
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

  // Force refresh on component mount if user is available
  useEffect(() => {
    if (user?.id && creatorId) {
      console.log('Force refreshing subscriptions on mount for user:', user.id, 'creator:', creatorId);
      refetchSubscriptions();
    }
  }, [user?.id, creatorId, refetchSubscriptions]);

  return {
    tiers,
    isLoading,
    isSubscribedToTier,
    handleSubscriptionSuccess,
  };
};
