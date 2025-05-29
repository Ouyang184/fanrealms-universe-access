
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
    staleTime: 30000,
    refetchInterval: 60000,
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
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active'); // Only get active subscriptions

      if (error) {
        console.error('[CreatorMembership] Error fetching subscriptions:', error);
        return [];
      }

      console.log('[CreatorMembership] Found active subscriptions:', data?.length || 0, data);
      
      // Process each subscription to ensure correct cancellation state
      const processedSubscriptions = data?.map(sub => {
        let isScheduledToCancel = false;
        let currentPeriodEnd = null;

        if (sub.cancel_at_period_end === true && sub.current_period_end) {
          // Handle both string and number timestamps
          if (typeof sub.current_period_end === 'string') {
            currentPeriodEnd = new Date(sub.current_period_end);
          } else {
            currentPeriodEnd = new Date(sub.current_period_end * 1000);
          }
          
          isScheduledToCancel = currentPeriodEnd > new Date();
        }

        return {
          ...sub,
          isScheduledToCancel,
          current_period_end: currentPeriodEnd ? currentPeriodEnd.toISOString() : sub.current_period_end
        };
      }) || [];

      return processedSubscriptions;
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 5000,
    refetchInterval: 15000, // Check more frequently to catch webhook updates
  });

  const isLoading = tiersLoading || subscriptionsLoading;

  // Enhanced subscription check that respects local state and cancellation status
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    console.log('[CreatorMembership] isSubscribedToTier called:', { tierId, userId: user?.id });
    
    // Check local state first for immediate updates
    if (localSubscriptionStates[tierId] !== undefined) {
      console.log('[CreatorMembership] Using local state for tier:', tierId, localSubscriptionStates[tierId]);
      return localSubscriptionStates[tierId].isSubscribed || false;
    }
    
    // Fall back to server data with enhanced logic
    const isSubscribed = userSubscriptions?.some(sub => {
      const isActive = sub.status === 'active';
      const isScheduledToCancel = sub.isScheduledToCancel;
      
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
    
    return isSubscribed;
  }, [userSubscriptions, localSubscriptionStates, user?.id]);

  // Get subscription data for a specific tier
  const getSubscriptionData = useCallback((tierId: string) => {
    // Check local state first
    if (localSubscriptionStates[tierId] !== undefined) {
      return localSubscriptionStates[tierId].subscription;
    }
    
    // Fall back to server data
    return userSubscriptions?.find(sub => sub.tier_id === tierId && sub.status === 'active') || null;
  }, [userSubscriptions, localSubscriptionStates]);

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
  const updateLocalSubscriptionState = useCallback((tierId: string, subscriptionData: any) => {
    console.log('[CreatorMembership] Updating local state for tier:', tierId, 'with data:', subscriptionData);
    setLocalSubscriptionStates(prev => ({
      ...prev,
      [tierId]: subscriptionData
    }));
    
    // Clear local state after delay to let server data take over
    setTimeout(() => {
      setLocalSubscriptionStates(prev => {
        const newState = { ...prev };
        delete newState[tierId];
        return newState;
      });
    }, 20000); // Increased timeout to allow more time for webhook processing
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
        }
        
        // Always perform full refresh after a short delay
        setTimeout(() => {
          handleSubscriptionSuccess();
        }, 2000);
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
