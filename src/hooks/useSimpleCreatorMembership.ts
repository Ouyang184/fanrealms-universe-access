
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
  const [localSubscriptionStates, setLocalSubscriptionStates] = useState<Record<string, any>>({});

  // Fetch membership tiers
  const { data: tiers, isLoading: tiersLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['simpleCreatorMembershipTiers', creatorId],
    queryFn: async () => {
      console.log('[CreatorMembership] Fetching tiers for creator:', creatorId);
      
      const { data: tiersData, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId as any)
        .order('price', { ascending: true });

      if (tiersError) throw tiersError;

      // Get subscriber counts for each tier from user_subscriptions table
      const tiersWithCounts = await Promise.all(
        (tiersData as any).map(async (tier: any) => {
          const { count, error: countError } = await supabase
            .from('user_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('tier_id', tier.id as any)
            .eq('status', 'active' as any);

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
    staleTime: 300000, // 5 minutes - much longer since we're not auto-refreshing
    // Removed refetchInterval - no automatic refresh
  });

  // Get user subscriptions for this creator - with enhanced cancellation handling
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['simpleUserCreatorSubscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[CreatorMembership] No user ID for subscription check');
        return [];
      }
      
      console.log('[CreatorMembership] Checking user subscriptions for user:', user.id, 'creator:', creatorId);
      
      // Query user_subscriptions table with proper status check
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id as any)
        .eq('creator_id', creatorId as any)
        .eq('status', 'active' as any); // Only get active subscriptions

      if (error) {
        console.error('[CreatorMembership] Error fetching subscriptions:', error);
        return [];
      }

      console.log('[CreatorMembership] Found active subscriptions:', data?.length || 0, data);
      
      // Process each subscription to ensure correct cancellation state
      const processedSubscriptions = (data as any)?.map((sub: any) => {
        let isScheduledToCancel = false;
        let currentPeriodEnd = null;

        if (sub.cancel_at_period_end === true && sub.current_period_end) {
          // Handle both string and number timestamps more carefully
          if (typeof sub.current_period_end === 'string') {
            currentPeriodEnd = new Date(sub.current_period_end);
          } else if (typeof sub.current_period_end === 'number') {
            currentPeriodEnd = new Date(sub.current_period_end * 1000);
          }
          
          if (currentPeriodEnd && !isNaN(currentPeriodEnd.getTime())) {
            isScheduledToCancel = currentPeriodEnd > new Date();
          }
        }

        console.log('[CreatorMembership] Processing subscription:', {
          id: sub.id,
          tierId: sub.tier_id,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodEnd: sub.current_period_end,
          isScheduledToCancel,
          processedPeriodEnd: currentPeriodEnd?.toISOString()
        });

        return {
          ...sub,
          isScheduledToCancel,
          current_period_end: currentPeriodEnd ? currentPeriodEnd.toISOString() : sub.current_period_end
        };
      }) || [];

      return processedSubscriptions;
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 300000, // 5 minutes - much longer
    // Removed refetchInterval - no automatic refresh
    refetchOnWindowFocus: false, // Disable refetch on window focus
  });

  const isLoading = tiersLoading || subscriptionsLoading;

  // Enhanced subscription check that respects local state and cancellation status
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    console.log('[CreatorMembership] isSubscribedToTier called:', { tierId, userId: user?.id });
    
    // Check local state first for immediate updates
    if (localSubscriptionStates[tierId] !== undefined) {
      const localState = localSubscriptionStates[tierId];
      console.log('[CreatorMembership] Using local state for tier:', tierId, localState);
      // If local state indicates cancellation, return true to show "ending soon" state
      return localState.isSubscribed || false;
    }
    
    // Fall back to server data with enhanced logic
    const isSubscribed = userSubscriptions?.some((sub: any) => {
      const isActive = sub.status === 'active';
      const matches = sub.tier_id === tierId && isActive;
      
      console.log('[CreatorMembership] Checking subscription:', {
        subTierId: sub.tier_id,
        targetTierId: tierId,
        status: sub.status,
        isActive,
        isScheduledToCancel: sub.isScheduledToCancel,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: sub.current_period_end,
        matches
      });
      return matches;
    }) || false;
    
    console.log('[CreatorMembership] Final result for tier:', tierId, 'isSubscribed:', isSubscribed);
    
    return isSubscribed;
  }, [userSubscriptions, localSubscriptionStates, user?.id]);

  // Get subscription data for a specific tier
  const getSubscriptionData = useCallback((tierId: string) => {
    // Check local state first
    if (localSubscriptionStates[tierId] !== undefined) {
      return localSubscriptionStates[tierId].subscription;
    }
    
    // Fall back to server data
    return userSubscriptions?.find((sub: any) => sub.tier_id === tierId && sub.status === 'active') || null;
  }, [userSubscriptions, localSubscriptionStates]);

  // Manual refresh function with delay
  const handleSubscriptionSuccess = useCallback(async (delayMs: number = 5000) => {
    console.log('[CreatorMembership] Manual refresh triggered with delay:', delayMs);
    
    // Wait for the specified delay to allow webhook processing
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
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
    
    console.log('[CreatorMembership] Manual refresh completed');
  }, [queryClient, refetchTiers, refetchSubscriptions]);

  // Update local subscription state optimistically
  const updateLocalSubscriptionState = useCallback((tierId: string, subscriptionData: any) => {
    console.log('[CreatorMembership] Updating local state for tier:', tierId, 'with data:', subscriptionData);
    setLocalSubscriptionStates(prev => ({
      ...prev,
      [tierId]: subscriptionData
    }));
    
    // Clear local state after longer delay to let server data take over
    setTimeout(() => {
      setLocalSubscriptionStates(prev => {
        const newState = { ...prev };
        delete newState[tierId];
        return newState;
      });
    }, 300000); // 5 minutes timeout to allow webhook processing
  }, []);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log('[CreatorMembership] Subscription event:', event.type, event.detail);
      
      if (event.detail?.creatorId === creatorId) {
        const { tierId } = event.detail;
        
        if (event.type === 'subscriptionSuccess' || event.type === 'paymentSuccess') {
          if (tierId) {
            updateLocalSubscriptionState(tierId, { isSubscribed: true, subscription: null });
          }
          // Manual refresh after successful subscription with short delay
          await handleSubscriptionSuccess(3000); // 3 seconds for subscription success
        } else if (event.type === 'subscriptionCanceled') {
          if (tierId) {
            // For cancellation, maintain the subscription but mark as scheduled to cancel
            const existingSubscription = getSubscriptionData(tierId);
            updateLocalSubscriptionState(tierId, { 
              isSubscribed: true, 
              subscription: {
                ...existingSubscription,
                cancel_at_period_end: true,
                isScheduledToCancel: true
              }
            });
          }
          // Manual refresh after cancellation with longer delay
          await handleSubscriptionSuccess(10000); // 10 seconds for cancellation to allow webhook processing
        }
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
  }, [creatorId, handleSubscriptionSuccess, updateLocalSubscriptionState, getSubscriptionData]);

  return {
    tiers,
    isLoading,
    isSubscribedToTier,
    getSubscriptionData,
    handleSubscriptionSuccess,
  };
};
