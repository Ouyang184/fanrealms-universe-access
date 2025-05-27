
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CreatorSubscriptionWithDetails {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  amount_paid: number | null;
  platform_fee: number | null;
  creator_earnings: number | null;
  created_at: string;
  updated_at: string | null;
  creator?: {
    id: string;
    display_name: string | null;
    bio: string | null;
    profile_image_url: string | null;
    banner_url: string | null;
    users?: {
      id: string;
      username: string;
      email: string;
      profile_picture: string | null;
    } | null;
  } | null;
  tier?: {
    id: string;
    title: string;
    description: string | null;
    price: number;
  } | null;
}

export const useStripeSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOperating, setIsOperating] = useState(false);

  // Fetch user's active subscriptions with creator and tier details
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['userActiveSubscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching active subscriptions for user:', user.id);
      
      const { data: subscriptions, error } = await supabase
        .from('creator_subscriptions')
        .select(`
          *,
          creator:creators (
            id,
            display_name,
            bio,
            profile_image_url,
            banner_url,
            users (
              id,
              username,
              email,
              profile_picture
            )
          ),
          tier:membership_tiers (
            id,
            title,
            description,
            price
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user subscriptions:', error);
        throw error;
      }

      console.log('Found user subscriptions:', subscriptions?.length || 0);
      return subscriptions as CreatorSubscriptionWithDetails[] || [];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: 5000,
  });

  // Cancel subscription function
  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    if (!user || isOperating) return;

    setIsOperating(true);
    try {
      console.log('Cancelling subscription:', subscriptionId);
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'cancel_subscription',
          subscriptionId: subscriptionId
        }
      });

      if (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
      }

      console.log('Subscription cancelled successfully:', data);
      
      // Refresh subscription data
      await refetchSubscriptions();
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('subscriptionCanceled', {
        detail: { subscriptionId }
      }));

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });

    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOperating(false);
    }
  }, [user, isOperating, refetchSubscriptions, toast]);

  // Enhanced refresh function with better error handling
  const refreshSubscriptions = useCallback(async () => {
    console.log('Refreshing subscription data...');
    
    try {
      // Invalidate related queries
      await queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['enhancedUserCreatorSubscriptions'] });
      
      // Force refetch
      await refetchSubscriptions();
      
      console.log('Subscription data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
    }
  }, [queryClient, refetchSubscriptions]);

  return {
    userSubscriptions,
    subscriptionsLoading,
    isOperating,
    cancelSubscription,
    refetchSubscriptions: refreshSubscriptions,
  };
};
