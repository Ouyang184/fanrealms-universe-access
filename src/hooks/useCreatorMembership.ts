
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

  // Fetch membership tiers with enhanced subscriber counts
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

      // Get enhanced subscriber counts for each tier (check both tables)
      const tiersWithCounts = await Promise.all(
        tiersData.map(async (tier) => {
          // Count from creator_subscriptions first
          const { count: creatorSubCount, error: creatorCountError } = await supabase
            .from('creator_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('tier_id', tier.id)
            .eq('status', 'active');

          // Count from subscriptions table as well
          const { count: regularSubCount, error: regularCountError } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('tier_id', tier.id)
            .eq('creator_id', creatorId)
            .eq('is_paid', true);

          if (creatorCountError) {
            console.error('Error counting creator subscriptions for tier:', tier.id, creatorCountError);
          }
          if (regularCountError) {
            console.error('Error counting regular subscriptions for tier:', tier.id, regularCountError);
          }

          // Use the higher count to ensure we don't miss any subscriptions
          const totalCount = Math.max(creatorSubCount || 0, regularSubCount || 0);

          return {
            id: tier.id,
            name: tier.title,
            price: tier.price,
            description: tier.description || '',
            features: tier.description ? tier.description.split('|') : [],
            subscriberCount: totalCount,
          };
        })
      );

      console.log('Fetched tiers with enhanced subscriber counts:', tiersWithCounts);
      return tiersWithCounts;
    },
    enabled: !!creatorId,
    staleTime: 0,
    refetchInterval: 2000,
  });

  // Get all user subscriptions to this creator (for unsubscribe functionality)
  const { data: userCreatorSubscriptions, refetch: refetchUserCreatorSubscriptions } = useQuery({
    queryKey: ['userCreatorSubscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching all user subscriptions to creator:', user.id, 'creator:', creatorId);
      
      // Check creator_subscriptions table first - get all active subscriptions to this creator
      const { data: creatorSubs, error: creatorSubsError } = await supabase
        .from('creator_subscriptions')
        .select('tier_id, status')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active');

      // Check subscriptions table as well - get all subscriptions to this creator
      const { data: regularSubs, error: regularSubsError } = await supabase
        .from('subscriptions')
        .select('tier_id')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('is_paid', true);

      if (creatorSubsError) {
        console.error('Error fetching creator subscriptions:', creatorSubsError);
      }
      if (regularSubsError) {
        console.error('Error fetching regular subscriptions:', regularSubsError);
      }

      // Combine results, prioritizing creator_subscriptions
      const allSubs = [...(creatorSubs || [])];
      
      // Add subscriptions from the regular table that aren't already covered
      if (regularSubs) {
        regularSubs.forEach(regSub => {
          const alreadyExists = allSubs.some(cs => cs.tier_id === regSub.tier_id);
          if (!alreadyExists) {
            allSubs.push({ tier_id: regSub.tier_id, status: 'active' });
          }
        });
      }

      console.log('User subscriptions to creator:', allSubs);
      return allSubs;
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 0,
    refetchInterval: 1000,
  });

  // Check if user is subscribed to ANY tier of this creator (for unsubscribe/cancel functionality)
  const isSubscribedToCreator = useCallback((): boolean => {
    return userCreatorSubscriptions ? userCreatorSubscriptions.length > 0 : false;
  }, [userCreatorSubscriptions]);

  // Check if user is subscribed to a specific tier (for subscribe button functionality)
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    // Check local state first for immediate updates
    if (localSubscriptionStates[tierId] !== undefined) {
      return localSubscriptionStates[tierId];
    }
    
    // Fall back to server data - check for specific tier subscription
    return userCreatorSubscriptions?.some(sub => sub.tier_id === tierId && sub.status === 'active') || false;
  }, [userCreatorSubscriptions, localSubscriptionStates]);

  // Handle subscription success with enhanced updates
  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('Enhanced subscription success detected, refreshing data...');
    
    // Invalidate all related queries immediately
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
      queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
    ]);

    // Force immediate refetch
    await Promise.all([
      refetchTiers(),
      refetchUserCreatorSubscriptions(),
    ]);
  }, [queryClient, refetchTiers, refetchUserCreatorSubscriptions]);

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
    isSubscribedToTier, // For individual tier subscribe buttons
    isSubscribedToCreator, // For creator-level unsubscribe functionality
    handleSubscriptionSuccess,
    updateLocalSubscriptionState,
  };
};
