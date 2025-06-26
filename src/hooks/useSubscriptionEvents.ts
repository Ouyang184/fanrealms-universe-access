
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSubscriptionEvents = () => {
  const queryClient = useQueryClient();

  const refreshAllSubscriptionData = useCallback(async () => {
    console.log('Refreshing all subscription-related data...');
    
    // Invalidate all subscription-related queries
    const queryKeys = [
      'enhancedUserSubscriptions',
      'active-subscribers', 
      'tiers',
      'creatorMembershipTiers',
      'userSubscriptions',
      'creator-posts',
      'subscriber-tiers',
      'creator-profile'
    ];

    await Promise.all(
      queryKeys.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );

    console.log('All subscription queries invalidated');
  }, [queryClient]);

  const triggerSubscriptionSuccess = useCallback((data?: any) => {
    console.log('Triggering subscription success event with data:', data);
    
    const event = new CustomEvent('subscriptionSuccess', {
      detail: { 
        ...data, 
        timestamp: Date.now(),
        source: 'useSubscriptionEvents'
      }
    });
    window.dispatchEvent(event);
    
    // Also trigger immediate refresh
    refreshAllSubscriptionData();
  }, [refreshAllSubscriptionData]);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log(`Subscription event detected: ${event.type}`, event.detail);
      await refreshAllSubscriptionData();
    };

    // Listen for all subscription-related events
    const events = [
      'subscriptionSuccess',
      'paymentSuccess', 
      'subscriptionCreated',
      'subscriptionUpdated',
      'subscriptionCanceled'
    ];

    events.forEach(eventType => {
      window.addEventListener(eventType, handleSubscriptionEvent as EventListener);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleSubscriptionEvent as EventListener);
      });
    };
  }, [refreshAllSubscriptionData]);

  return {
    refreshAllSubscriptionData,
    triggerSubscriptionSuccess
  };
};
