
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCancelSubscription = (refetchSubscriptions?: () => Promise<void>) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOperating, setIsOperating] = useState(false);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    if (!user || isOperating) return;

    setIsOperating(true);
    try {
      console.log('Cancelling subscription:', subscriptionId);
      
      // Make sure we're calling the correct function name: 'stripe-subscriptions'
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
      if (refetchSubscriptions) {
        await refetchSubscriptions();
      }
      
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

  return {
    cancelSubscription,
    isOperating
  };
};
