
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionEventDetail {
  tierId?: string;
  creatorId?: string;
  subscriptionId?: string;
  paymentIntentId?: string;
  userId?: string;
}

export const useSubscriptionEventManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateAllSubscriptionQueries = useCallback(async () => {
    console.log('Invalidating all subscription-related queries...');
    
    const queryKeys = [
      'user-subscriptions',
      'simple-user-subscriptions',
      'simple-creator-subscribers',
      'simple-subscription-check',
      'subscription-check',
      'userActiveSubscriptions',
      'userCreatorSubscriptions',
      'creatorMembershipTiers',
      'creator-profile',
      'creators'
    ];

    await Promise.all(
      queryKeys.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );

    // Force immediate refetch of critical queries
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['user-subscriptions'] }),
      queryClient.refetchQueries({ queryKey: ['simple-user-subscriptions'] }),
    ]);

    console.log('All subscription queries invalidated and refetched');
  }, [queryClient]);

  const handleSubscriptionSuccess = useCallback(async (detail: SubscriptionEventDetail) => {
    console.log('Handling subscription success:', detail);
    
    toast({
      title: "Subscription Active!",
      description: "Your subscription has been successfully activated.",
    });

    // Wait a moment for server processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await invalidateAllSubscriptionQueries();
  }, [toast, invalidateAllSubscriptionQueries]);

  const handleSubscriptionCancellation = useCallback(async (detail: SubscriptionEventDetail) => {
    console.log('Handling subscription cancellation:', detail);
    
    toast({
      title: "Subscription Cancelled",
      description: "Your subscription has been cancelled successfully.",
    });

    await invalidateAllSubscriptionQueries();
  }, [toast, invalidateAllSubscriptionQueries]);

  const triggerSubscriptionSuccess = useCallback((detail: SubscriptionEventDetail) => {
    const event = new CustomEvent('subscriptionSuccess', { detail });
    window.dispatchEvent(event);
  }, []);

  const triggerSubscriptionCancellation = useCallback((detail: SubscriptionEventDetail) => {
    const event = new CustomEvent('subscriptionCancelled', { detail });
    window.dispatchEvent(event);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleSuccess = (event: CustomEvent) => {
      handleSubscriptionSuccess(event.detail);
    };

    const handleCancellation = (event: CustomEvent) => {
      handleSubscriptionCancellation(event.detail);
    };

    const handlePaymentSuccess = (event: CustomEvent) => {
      handleSubscriptionSuccess(event.detail);
    };

    window.addEventListener('subscriptionSuccess', handleSuccess as EventListener);
    window.addEventListener('subscriptionCancelled', handleCancellation as EventListener);
    window.addEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSuccess as EventListener);
      window.removeEventListener('subscriptionCancelled', handleCancellation as EventListener);
      window.removeEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
    };
  }, [handleSubscriptionSuccess, handleSubscriptionCancellation]);

  return {
    triggerSubscriptionSuccess,
    triggerSubscriptionCancellation,
    invalidateAllSubscriptionQueries
  };
};
