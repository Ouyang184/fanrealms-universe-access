
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

  // Fetch membership tiers with accurate subscriber counts
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

      // Get accurate subscriber counts by calling our sync function
      const tiersWithCounts = await Promise.all(
        tiersData.map(async (tier) => {
          try {
            // Call edge function to get accurate subscriber count
            const { data: countResult, error: countError } = await supabase.functions.invoke('stripe-subscriptions', {
              body: {
                action: 'get_subscriber_count',
                tierId: tier.id,
                creatorId: creatorId
              }
            });

            if (countError) {
              console.error('Error getting subscriber count for tier:', tier.id, countError);
            }

            const subscriberCount = countResult?.subscriberCount || 0;

            return {
              id: tier.id,
              name: tier.title,
              price: tier.price,
              description: tier.description || '',
              features: tier.description ? tier.description.split('|') : [],
              subscriberCount: subscriberCount,
            };
          } catch (error) {
            console.error('Error processing tier:', tier.id, error);
            return {
              id: tier.id,
              name: tier.title,
              price: tier.price,
              description: tier.description || '',
              features: tier.description ? tier.description.split('|') : [],
              subscriberCount: 0,
            };
          }
        })
      );

      console.log('Fetched tiers with accurate subscriber counts:', tiersWithCounts);
      return tiersWithCounts;
    },
    enabled: !!creatorId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Get user subscriptions with enhanced checking
  const { data: userCreatorSubscriptions, refetch: refetchUserCreatorSubscriptions } = useQuery({
    queryKey: ['userCreatorSubscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Checking user subscriptions for user:', user.id, 'creator:', creatorId);
      
      // Call our enhanced subscription check
      const { data: subsResult, error: subsError } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'get_user_subscriptions',
          userId: user.id,
          creatorId: creatorId
        }
      });

      if (subsError) {
        console.error('Error fetching user subscriptions:', subsError);
        return [];
      }

      console.log('User subscriptions to creator found:', subsResult?.subscriptions?.length || 0);
      return subsResult?.subscriptions || [];
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Check if user is subscribed to ANY tier of this creator
  const isSubscribedToCreator = useCallback((): boolean => {
    const hasSubscriptions = userCreatorSubscriptions ? userCreatorSubscriptions.length > 0 : false;
    console.log('isSubscribedToCreator check:', hasSubscriptions, userCreatorSubscriptions);
    return hasSubscriptions;
  }, [userCreatorSubscriptions]);

  // Check if user is subscribed to a specific tier
  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    // Check local state first for immediate updates
    if (localSubscriptionStates[tierId] !== undefined) {
      console.log('Using local state for tier:', tierId, localSubscriptionStates[tierId]);
      return localSubscriptionStates[tierId];
    }
    
    // Fall back to server data
    const isSubscribed = userCreatorSubscriptions?.some(sub => 
      sub.tier_id === tierId && sub.status === 'active'
    ) || false;
    
    console.log('isSubscribedToTier check for tier:', tierId, 'result:', isSubscribed);
    return isSubscribed;
  }, [userCreatorSubscriptions, localSubscriptionStates]);

  // Handle subscription success with full sync
  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('Subscription success detected, performing full sync...');
    
    // Call our sync function to ensure everything is up to date
    try {
      await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'sync_all_subscriptions',
          creatorId: creatorId
        }
      });
    } catch (error) {
      console.error('Error syncing subscriptions:', error);
    }
    
    // Invalidate all related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
      queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
    ]);

    // Force immediate refetch
    await Promise.all([
      refetchTiers(),
      refetchUserCreatorSubscriptions(),
    ]);
  }, [queryClient, refetchTiers, refetchUserCreatorSubscriptions, creatorId]);

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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `creator_id=eq.${creatorId}`
      }, (payload) => {
        console.log('Real-time update received for basic subscriptions:', payload);
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
    isSubscribedToCreator,
    handleSubscriptionSuccess,
    updateLocalSubscriptionState,
  };
};
