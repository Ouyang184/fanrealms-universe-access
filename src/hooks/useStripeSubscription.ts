
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useStripeSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Enhanced fetch of user subscriptions from creator_subscriptions table
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['enhancedUserSubscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching enhanced user subscriptions for user:', user.id);
      
      // Query creator_subscriptions with full creator and tier details
      const { data: subscriptions, error } = await supabase
        .from('creator_subscriptions')
        .select(`
          id,
          user_id,
          creator_id,
          tier_id,
          status,
          current_period_start,
          current_period_end,
          amount_paid,
          created_at,
          updated_at,
          creator:creators!creator_subscriptions_creator_id_fkey (
            id,
            user_id,
            display_name,
            bio,
            profile_image_url,
            banner_url,
            users:users!creators_user_id_fkey (
              id,
              username,
              email,
              profile_picture
            )
          ),
          tier:membership_tiers!creator_subscriptions_tier_id_fkey (
            id,
            title,
            description,
            price
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user subscriptions:', error);
        return [];
      }

      console.log('Enhanced user subscriptions fetched:', subscriptions);
      return subscriptions || [];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Create subscription function
  const createSubscription = useCallback(async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Creating subscription for tier:', tierId, 'creator:', creatorId);

    const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
      body: {
        action: 'create_subscription',
        tier_id: tierId,
        creator_id: creatorId,
        user_id: user.id
      }
    });

    if (error) {
      console.error('Error creating subscription:', error);
      throw new Error(error.message || 'Failed to create subscription');
    }

    console.log('Subscription created successfully:', data);
    return data;
  }, [user]);

  // Function to trigger subscription success events
  const triggerSubscriptionEvents = useCallback((subscriptionData?: any) => {
    console.log('Triggering subscription success events with data:', subscriptionData);
    
    // Dispatch custom events for other components to listen to
    const events = ['subscriptionSuccess', 'paymentSuccess'];
    
    events.forEach(eventType => {
      const event = new CustomEvent(eventType, {
        detail: subscriptionData || { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    });
  }, []);

  // Enhanced subscription refresh function
  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('Enhanced subscription success handler triggered');
    setIsProcessing(true);
    
    try {
      // Invalidate all subscription-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['active-subscribers'] }),
        queryClient.invalidateQueries({ queryKey: ['tiers'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['creator-posts'] }),
      ]);

      // Force immediate refetch
      await refetchSubscriptions();
      
      // Trigger events for other components
      triggerSubscriptionEvents();
      
      console.log('All subscription queries refreshed successfully');
    } catch (error) {
      console.error('Error refreshing subscription data:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [queryClient, refetchSubscriptions, triggerSubscriptionEvents]);

  // Cancel subscription function with proper error handling
  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsProcessing(true);
    try {
      console.log('Canceling subscription:', subscriptionId);
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'cancel_subscription',
          subscriptionId: subscriptionId,
          user_id: user.id
        }
      });

      if (error) {
        console.error('Error canceling subscription:', error);
        throw new Error(error.message || 'Failed to cancel subscription');
      }

      console.log('Subscription canceled successfully:', data);
      
      // Trigger cancellation events
      const event = new CustomEvent('subscriptionCanceled', {
        detail: { subscriptionId, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      
      // Refresh subscription data
      await handleSubscriptionSuccess();
      
      return data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, handleSubscriptionSuccess]);

  // Listen for subscription events from other parts of the app
  useEffect(() => {
    const handleGlobalSubscriptionUpdate = async (event: CustomEvent) => {
      console.log('Global subscription update detected:', event.type, event.detail);
      await handleSubscriptionSuccess();
    };

    // Listen for various subscription events
    window.addEventListener('subscriptionSuccess', handleGlobalSubscriptionUpdate as EventListener);
    window.addEventListener('paymentSuccess', handleGlobalSubscriptionUpdate as EventListener);
    window.addEventListener('subscriptionCreated', handleGlobalSubscriptionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleGlobalSubscriptionUpdate as EventListener);
      window.removeEventListener('paymentSuccess', handleGlobalSubscriptionUpdate as EventListener);
      window.removeEventListener('subscriptionCreated', handleGlobalSubscriptionUpdate as EventListener);
    };
  }, [handleSubscriptionSuccess]);

  // Set up real-time subscription for database changes
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for user subscriptions:', user.id);
    
    const channel = supabase
      .channel(`user-subscriptions-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'creator_subscriptions',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Real-time subscription update received:', payload);
        handleSubscriptionSuccess();
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleSubscriptionSuccess]);

  return {
    userSubscriptions,
    subscriptionsLoading,
    isProcessing,
    setIsProcessing,
    refetchSubscriptions,
    handleSubscriptionSuccess,
    cancelSubscription,
    createSubscription,
  };
};
