
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSubscriptionEvents = () => {
  const queryClient = useQueryClient();

  const refreshAllSubscriptionData = useCallback(async () => {
    console.log('Refreshing subscription-related data...');
    
    // Optimized: Only invalidate queries that are actually being used
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

    // Use Promise.allSettled instead of Promise.all to avoid one failure blocking others
    const results = await Promise.allSettled(
      queryKeys.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );

    // Log any failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`Failed to invalidate query ${queryKeys[index]}:`, result.reason);
      }
    });

    console.log('Subscription queries invalidated');
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
    
    // Use setTimeout to avoid blocking the event dispatch
    setTimeout(() => {
      refreshAllSubscriptionData();
    }, 0);
  }, [refreshAllSubscriptionData]);

  // Optimized: Listen for subscription events without excessive realtime subscriptions
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log(`Subscription event detected: ${event.type}`, event.detail);
      // Use setTimeout to avoid blocking event handlers
      setTimeout(() => {
        refreshAllSubscriptionData();
      }, 0);
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
