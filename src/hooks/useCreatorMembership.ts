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

  // COMPLETELY REMOVED realtime - now using very long cache times and manual refresh only
  const { data: tiers, isLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['creatorMembershipTiers', creatorId],
    queryFn: async () => {
      console.log('[CreatorMembership] Fetching membership tiers for creator:', creatorId);
      
      const { data: tiersData, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId as any)
        .eq('active', true as any)
        .order('price', { ascending: true });

      if (tiersError) {
        console.error('[CreatorMembership] Error fetching tiers:', tiersError);
        throw tiersError;
      }

      console.log('[CreatorMembership] Found tiers:', tiersData?.length || 0);

      const tiersWithCounts = await Promise.all(
        (tiersData || []).map(async (tier: any) => {
          console.log('[CreatorMembership] Counting subscribers for tier:', (tier as any).id, (tier as any).title);
          
          try {
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
    staleTime: 600000, // 10 minute cache to drastically reduce queries
    refetchInterval: false, // COMPLETELY DISABLED to prevent excessive queries
  });

  // COMPLETELY REMOVED realtime - now using very long cache times
  const { data: userCreatorSubscriptions, refetch: refetchUserCreatorSubscriptions } = useQuery({
    queryKey: ['userCreatorSubscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[CreatorMembership] Checking user subscriptions for user:', user.id, 'creator:', creatorId);
      
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
    staleTime: 600000, // 10 minute cache to drastically reduce queries
    refetchInterval: false, // COMPLETELY DISABLED to prevent excessive queries
  });

  const isSubscribedToCreator = useCallback((): boolean => {
    const hasActiveSubscriptions = userCreatorSubscriptions ? 
      userCreatorSubscriptions.some((sub: any) => (sub as any).status === 'active' || (sub as any).status === 'cancelling') : false;
    return hasActiveSubscriptions;
  }, [userCreatorSubscriptions]);

  const isSubscribedToTier = useCallback((tierId: string): boolean => {
    if (localSubscriptionStates[tierId] !== undefined) {
      return localSubscriptionStates[tierId];
    }
    
    const isSubscribed = userCreatorSubscriptions?.some((sub: any) => 
      (sub as any).tier_id === tierId && ((sub as any).status === 'active' || (sub as any).status === 'cancelling')
    ) || false;
    
    return isSubscribed;
  }, [userCreatorSubscriptions, localSubscriptionStates]);

  const getSubscriptionData = useCallback((tierId: string) => {
    const subscription = userCreatorSubscriptions?.find((sub: any) => 
      (sub as any).tier_id === tierId && ((sub as any).status === 'active' || (sub as any).status === 'cancelling')
    );
    return subscription;
  }, [userCreatorSubscriptions]);

  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('[CreatorMembership] Manual subscription success detected, performing controlled sync...');
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
      queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
    ]);

    // Delayed refetch to avoid overwhelming the system
    setTimeout(async () => {
      await Promise.all([
        refetchTiers(),
        refetchUserCreatorSubscriptions(),
      ]);
    }, 3000);
  }, [queryClient, refetchTiers, refetchUserCreatorSubscriptions]);

  const updateLocalSubscriptionState = useCallback((tierId: string, isSubscribed: boolean) => {
    console.log('[CreatorMembership] Updating local subscription state for tier:', tierId, 'to:', isSubscribed);
    setLocalSubscriptionStates(prev => ({
      ...prev,
      [tierId]: isSubscribed
    }));
    
    setTimeout(() => {
      setLocalSubscriptionStates(prev => {
        const newState = { ...prev };
        delete newState[tierId];
        return newState;
      });
    }, 30000); // 30 seconds
  }, []);

  // Listen for custom events only - NO realtime DB subscriptions
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log('[CreatorMembership] Manual subscription event detected:', event.type, event.detail);
      
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
        
        // Very delayed sync to avoid overwhelming the database
        setTimeout(() => handleSubscriptionSuccess(), 5000);
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

  // COMPLETELY REMOVED all real-time database subscriptions

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
