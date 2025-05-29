
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
      console.log('[CreatorMembership] Fetching tiers for creator:', creatorId);
      
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
            console.error('[CreatorMembership] Error counting subscribers for tier:', tier.id, countError);
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

      console.log('[CreatorMembership] Fetched tiers with counts:', tiersWithCounts);
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
        console.log('[CreatorMembership] No user ID for subscription check');
        return [];
      }
      
      console.log('[CreatorMembership] Checking user subscriptions for user:', user.id, 'creator:', creatorId);
      
      // Query user_subscriptions table with proper status check using improved logic
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active'); // Only get active subscriptions

      if (error) {
        console.error('[CreatorMembership] Error fetching subscriptions:', error);
        return [];
      }

      console.log('[CreatorMembership] Found active subscriptions:', data?.length || 0, data);
      return data || [];
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 0,
    refetchInterval: 30000,
  });

  const isLoading = tiersLoading || subscriptionsLoading;

  // Check if user is subscribed to a specific tier using improved logic
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    console.log('[CreatorMembership] isSubscribedToTier called:', { tierId, userId: user?.id });
    
    // Check local state first for immediate updates
    if (localSubscriptionStates[tierId] !== undefined) {
      console.log('[CreatorMembership] Using local state for tier:', tierId, localSubscriptionStates[tierId]);
      return localSubscriptionStates[tierId];
    }
    
    // Fall back to server data using improved subscription logic
    const isSubscribed = userSubscriptions?.some(sub => {
      const isActive = sub.status === 'active';
      const isScheduledToCancel = sub.cancel_at_period_end === true &&
                                 sub.current_period_end && 
                                 new Date(sub.current_period_end) > new Date();
      
      // Consider subscribed if active, regardless of cancellation schedule
      const matches = sub.tier_id === tierId && isActive;
      
      console.log('[CreatorMembership] Checking subscription:', {
        subTierId: sub.tier_id,
        targetTierId: tierId,
        status: sub.status,
        isActive,
        isScheduledToCancel,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: sub.current_period_end,
        matches
      });
      return matches;
    }) || false;
    
    console.log('[CreatorMembership] Final result for tier:', tierId, 'isSubscribed:', isSubscribed);
    console.log('[CreatorMembership] All subscriptions:', userSubscriptions);
    
    return isSubscribed;
  }, [userSubscriptions, localSubscriptionStates, user?.id]);

  // Handle subscription success
  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('[CreatorMembership] Subscription success - refreshing all data...');
    
    // Invalidate all related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['simpleCreatorMembershipTiers'] }),
      queryClient.invalidateQueries({ queryKey: ['simpleUserCreatorSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
    ]);

    // Force immediate refetch
    await Promise.all([
      refetchTiers(),
      refetchSubscriptions(),
    ]);
  }, [queryClient, refetchTiers, refetchSubscriptions]);

  // Update local subscription state optimistically
  const updateLocalSubscriptionState = useCallback((tierId: string, isSubscribed: boolean) => {
    console.log('[CreatorMembership] Updating local state for tier:', tierId, 'to:', isSubscribed);
    setLocalSubscriptionStates(prev => ({
      ...prev,
      [tierId]: isSubscribed
    }));
    
    // Clear local state after delay to let server data take over
    setTimeout(() => {
      setLocalSubscriptionStates(prev => {
        const newState = { ...prev };
        delete newState[tierId];
        return newState;
      });
    }, 10000);
  }, []);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log('[CreatorMembership] Subscription event:', event.type, event.detail);
      
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

  return {
    tiers,
    isLoading,
    isSubscribedToTier,
    handleSubscriptionSuccess,
  };
};
