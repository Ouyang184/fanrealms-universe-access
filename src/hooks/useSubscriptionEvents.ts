
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSubscriptionEvents = () => {
  const queryClient = useQueryClient();

  const refreshAllSubscriptionData = useCallback(async () => {
    console.log('Refreshing subscription-related data...');
    
    // Only invalidate the most critical queries - no realtime needed
    const criticalQueryKeys = [
      'user-subscriptions',
      'simple-user-subscriptions'
    ];
    
    // Use requestIdleCallback to avoid blocking main thread
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        criticalQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        criticalQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }, 500);
    }

    console.log('Critical subscription queries invalidated');
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
    
    // Use requestIdleCallback to avoid blocking
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => refreshAllSubscriptionData());
    } else {
      setTimeout(() => refreshAllSubscriptionData(), 100);
    }
  }, [refreshAllSubscriptionData]);

  // REMOVED excessive realtime subscriptions - use events only
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log(`Subscription event detected: ${event.type}`, event.detail);
      
      // Use requestIdleCallback to avoid blocking critical operations
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => refreshAllSubscriptionData());
      } else {
        setTimeout(() => refreshAllSubscriptionData(), 100);
      }
    };

    // Only essential events - no realtime database subscriptions
    const events = ['subscriptionSuccess', 'paymentSuccess'];

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
