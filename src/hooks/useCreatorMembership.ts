
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  subscriberCount: number;
}

export function useCreatorMembership(creatorId: string) {
  const { user } = useAuth();

  // Fetch membership tiers for this creator with accurate subscriber counts
  const { data: tiers = [], isLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['creatorMembershipTiers', creatorId],
    queryFn: async () => {
      if (!creatorId) return [];
      
      console.log('Fetching membership tiers for creator:', creatorId);
      
      const { data: tiersData, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId)
        .order('price', { ascending: true });
      
      if (error) {
        console.error('Error fetching tiers:', error);
        return [];
      }
      
      console.log('Fetched tiers data:', tiersData);
      
      // Count active subscribers for each tier
      const tiersWithSubscribers = await Promise.all(tiersData.map(async (tier) => {
        console.log('Counting subscribers for tier:', tier.id);
        
        // Count from creator_subscriptions table with active status
        const { count, error: countError } = await supabase
          .from('creator_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('tier_id', tier.id)
          .eq('status', 'active');

        if (countError) {
          console.error('Error counting subscribers for tier:', tier.id, countError);
        }

        console.log('Subscriber count for tier', tier.id, ':', count);
          
        return {
          id: tier.id,
          name: tier.title,
          price: tier.price,
          description: tier.description,
          features: tier.description ? [tier.description] : ['Access to exclusive content'],
          subscriberCount: count || 0
        };
      }));
      
      console.log('Final tiers with subscriber counts:', tiersWithSubscribers);
      return tiersWithSubscribers;
    },
    enabled: !!creatorId,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 2000, // Very frequent updates
  });

  // Check user's current subscriptions to this creator - more aggressive refresh
  const { data: userSubscriptions = [], refetch: refetchSubscriptions } = useQuery({
    queryKey: ['userCreatorSubscriptions', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Checking user subscriptions for user:', user.id, 'creator:', creatorId);
      
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select('tier_id, status, stripe_subscription_id, id')
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
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 1000, // Every second for immediate updates
  });

  const isSubscribedToTier = (tierId: string) => {
    const isSubscribed = userSubscriptions.some(sub => sub.tier_id === tierId && sub.status === 'active');
    console.log(`Checking subscription for tier ${tierId}:`, isSubscribed, 'userSubscriptions:', userSubscriptions);
    return isSubscribed;
  };

  const handleSubscriptionSuccess = () => {
    console.log('Manual subscription refresh triggered');
    
    // Immediate multiple refreshes
    Promise.all([
      refetchTiers(),
      refetchSubscriptions()
    ]);
    
    // Staggered refreshes to ensure data consistency
    setTimeout(() => {
      Promise.all([refetchTiers(), refetchSubscriptions()]);
    }, 500);
    
    setTimeout(() => {
      Promise.all([refetchTiers(), refetchSubscriptions()]);
    }, 1500);
    
    setTimeout(() => {
      Promise.all([refetchTiers(), refetchSubscriptions()]);
    }, 3000);
    
    setTimeout(() => {
      Promise.all([refetchTiers(), refetchSubscriptions()]);
    }, 5000);
  };

  // Listen for subscription success events with immediate refresh
  useEffect(() => {
    const handleSubscriptionSuccessEvent = (event: CustomEvent) => {
      const { creatorId: eventCreatorId } = event.detail || {};
      console.log('Subscription success event received:', event.detail);
      
      if (eventCreatorId === creatorId || !eventCreatorId) {
        console.log('Subscription successful for this creator, refreshing data...');
        handleSubscriptionSuccess();
      }
    };

    const handlePaymentSuccess = () => {
      console.log('Payment successful, refreshing subscription data...');
      handleSubscriptionSuccess();
    };

    const handleSubscriptionCanceled = () => {
      console.log('Subscription canceled, refreshing subscription data...');
      handleSubscriptionSuccess();
    };

    // Listen for multiple event types
    window.addEventListener('subscriptionSuccess', handleSubscriptionSuccessEvent as EventListener);
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    window.addEventListener('subscriptionCanceled', handleSubscriptionCanceled);
    
    // Also listen for page visibility changes to refresh when user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing subscription data...');
        handleSubscriptionSuccess();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionSuccessEvent as EventListener);
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionCanceled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [creatorId]);

  // Auto-refresh on mount
  useEffect(() => {
    if (user?.id && creatorId) {
      console.log('Component mounted, refreshing subscription data...');
      handleSubscriptionSuccess();
    }
  }, [user?.id, creatorId]);

  return {
    tiers,
    isLoading,
    userSubscriptions,
    isSubscribedToTier,
    handleSubscriptionSuccess,
    refetchTiers,
    refetchSubscriptions
  };
}
