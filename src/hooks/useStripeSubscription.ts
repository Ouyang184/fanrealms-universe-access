
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useStripeSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user's subscriptions
  const { data: userSubscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['userSubscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select(`
          *,
          creator:creators(
            id,
            display_name,
            users!creators_user_id_fkey(username)
          ),
          tier:membership_tiers(
            id,
            title,
            price,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Create subscription
  const { mutate: createSubscription } = useMutation({
    mutationFn: async ({ tierId, creatorId }: { tierId: string, creatorId: string }) => {
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: { action: 'create_subscription', tierId, creatorId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Return client secret for payment confirmation
      return data;
    },
    onError: (error) => {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Cancel subscription
  const { mutate: cancelSubscription } = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: { action: 'cancel_subscription', subscriptionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      toast({
        title: "Success",
        description: "Subscription canceled successfully.",
      });
    },
    onError: (error) => {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    userSubscriptions,
    subscriptionsLoading,
    createSubscription,
    cancelSubscription,
    isProcessing,
    setIsProcessing
  };
};
