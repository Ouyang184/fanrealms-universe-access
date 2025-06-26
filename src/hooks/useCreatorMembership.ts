
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

  // Fetch membership tiers with accurate subscriber counts from user_subscriptions
  const { data: tiers, isLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['creatorMembershipTiers', creatorId],
    queryFn: async () => {
      console.log('[CreatorMembership] Fetching membership tiers for creator:', creatorId);
      
      const { data: tiersData, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId as any)
        .eq('active', true as any) // Only get active tiers
        .order('price', { ascending: true });

      if (tiersError) {
        console.error('[CreatorMembership] Error fetching tiers:', tiersError);
        throw tiersError;
      }

      console.log('[CreatorMembership] Found tiers:', tiersData?.length || 0);

      // Get accurate subscriber counts for each tier from user_subscriptions table
      const tiersWithCounts = await Promise.all(
        (tiersData || []).map(async (tier: any) => {
          console.log('[CreatorMembership] Counting subscribers for tier:', (tier as any).id, (tier as any).title);
          
          try {
            // Count active subscribers for this specific tier
            const { count, error: countError } = await supabase
              .from('user_subscriptions')
              .select('*', { count: 'exact', head: true })
              .eq('tier_id', (tier as any).id as any)
              .eq('creator_id', creatorId as any)
              .eq('status', 'active' as any);

            if (countError) {
              console.error('[CreatorMembership] Error counting subscribers for tier:', (tier as any).id, countError);
              return {
                id: (tier as any).id,
                name: (tier as any).title,
                price: (tier as any).price,
                description: (tier as any).description || '',
                features: (tier as any).description ? (tier as any).description.split('|').filter((f: string) => f.trim()) : [],
                subscriberCount: 0,
              };
            }

            const subscriberCount = count || 0;
            console.log('[CreatorMembership] Tier', (tier as any).title, 'has', subscriberCount, 'active subscribers');

            return {
              id: (tier as any).id,
              name: (tier as any).title,
              price: (tier as any).price,
              description: (tier as any).description || '',
              features: (tier as any).description ? (tier as any).description.split('|').filter((f: string) => f.trim()) : [],
              subscriberCount,
            };
          } catch (error) {
            console.error('[CreatorMembership] Error processing tier:', (tier as any).id, error);
            return {
              id: (tier as any).id,
              name: (tier as any).title,
              price: (tier as any).price,
              description: (tier as any).description || '',
              features: (tier as any).description ? (tier as any).description.split('|').filter((f: string) => f.trim()) : [],
              subscriberCount: 0,
            };
          }
        })
      );

      console.log('[CreatorMembership] Final tiers with subscriber counts:', tiersWithCounts);
      return tiersWithCounts;
    },
    enabled: !!creatorId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute to keep counts fresh
  });

  // Get user subscriptions from user_subscriptions table only
  const { data: userCreatorSubscriptions, refetch: refetchUserCreatorSubscriptions } = useQuery({
    queryKey: ['userCreatorSubscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[CreatorMembership] Checking user subscriptions for user:', user.id, 'creator:', creatorId);
      
      // Query user_subscriptions table directly - include both active and cancelling
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id as any)
        .eq('creator_id', creatorId as any);

      if (error) {
        console.error('[CreatorMembership] Error fetching user subscriptions:', error);
        return [];
      }

      console.log('[CreatorMembership] User subscriptions to creator found:', data?.length || 0);
      return data || [];
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Check if user is subscribed to ANY tier of this creator
  const isSubscribedToCreator = useCallback((): boolean => {
    const hasActiveSubscriptions = userCreatorSubscriptions ? 
      userCreatorSubscriptions.some((sub: any) => (sub as any).status === 'active' || (sub as any).status === 'cancelling') : false;
    return hasActiveSubscriptions;
  }, [userCreatorSubscriptions]);

  // Check if user is subscribed to a specific tier
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    // Check local state first for immediate updates
    if (localSubscriptionStates[tierId] !== undefined) {
      return localSubscriptionStates[tierId];
    }
    
    // Fall back to server data from user_subscriptions - include cancelling status
    const isSubscribed = userCreatorSubscriptions?.some((sub: any) => 
      (sub as any).tier_id === tierId && ((sub as any).status === 'active' || (sub as any).status === 'cancelling')
    ) || false;
    
    return isSubscribed;
  }, [userCreatorSubscriptions, localSubscriptionStates]);

  // Get subscription data for a specific tier - include cancelling subscriptions
  const getSubscriptionData = useCallback((tierId: string) => {
    const subscription = userCreatorSubscriptions?.find((sub: any) => 
      (sub as any).tier_id === tierId && ((sub as any).status === 'active' || (sub as any).status === 'cancelling')
    );
    return subscription;
  }, [userCreatorSubscriptions]);

  // Handle subscription success with full sync
  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('[CreatorMembership] Subscription success detected, performing full sync...');
    
    // Invalidate all related queries to force fresh data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
      queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
    ]);

    // Force immediate refetch
    await Promise.all([
      refetchTiers(),
      refetchUserCreatorSubscriptions(),
    ]);
  }, [queryClient, refetchTiers, refetchUserCreatorSubscriptions]);

  // Update local subscription state optimistically
  const updateLocalSubscriptionState = useCallback((tierId: string, isSubscribed: boolean) => {
    console.log('[CreatorMembership] Updating local subscription state for tier:', tierId, 'to:', isSubscribed);
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
      console.log('[CreatorMembership] Subscription event detected:', event.type, event.detail);
      
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
        
        // Always perform full sync on any subscription event
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

  // Set up real-time subscription for user_subscriptions table changes only
  useEffect(() => {
    if (!creatorId) return;

    console.log('[CreatorMembership] Setting up real-time subscription for user_subscriptions table, creator:', creatorId);
    
    const channel = supabase
      .channel(`user-subscriptions-updates-${creatorId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `creator_id=eq.${creatorId}`
      }, (payload) => {
        console.log('[CreatorMembership] Real-time update received for user_subscriptions:', payload);
        handleSubscriptionSuccess();
      })
      .subscribe();

    return () => {
      console.log('[CreatorMembership] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [creatorId, handleSubscriptionSuccess]);

  return {
    tiers,
    isLoading,
    isSubscribedToTier,
    isSubscribedToCreator,
    getSubscriptionData,
    handleSubscriptionSuccess,
    updateLocalSubscriptionState,
  };
};
