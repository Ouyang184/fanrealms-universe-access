
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSubscriptionEvents = () => {
  const queryClient = useQueryClient();

  const refreshAllSubscriptionData = useCallback(async () => {
    console.log('Refreshing subscription-related data via manual invalidation...');
    
    // Only invalidate when explicitly needed - no automatic refresh
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
      setTimeout(() => {
        criticalQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }, 1000);
    }

    console.log('Manual subscription queries invalidated');
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
    
    // Delayed refresh to avoid overwhelming the system
    setTimeout(() => refreshAllSubscriptionData(), 2000);
  }, [refreshAllSubscriptionData]);

  // COMPLETELY REMOVED all realtime subscriptions - use custom events only
  useEffect(() => {
    const handleSubscriptionEvent = async (event: CustomEvent) => {
      console.log(`Manual subscription event detected: ${event.type}`, event.detail);
      
      // Use requestIdleCallback to avoid blocking critical operations
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => refreshAllSubscriptionData());
      } else {
        setTimeout(() => refreshAllSubscriptionData(), 2000);
      }
    };

    // Only essential custom events - NO database realtime subscriptions
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
