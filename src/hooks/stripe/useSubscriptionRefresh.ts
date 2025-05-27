
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSubscriptionRefresh = (refetchSubscriptions?: () => Promise<void>) => {
  const queryClient = useQueryClient();

  const refreshSubscriptions = useCallback(async () => {
    console.log('Refreshing subscription data...');
    
    try {
      // Invalidate related queries
      await queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['enhancedUserCreatorSubscriptions'] });
      
      // Force refetch if available
      if (refetchSubscriptions) {
        await refetchSubscriptions();
      }
      
      console.log('Subscription data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
    }
  }, [queryClient, refetchSubscriptions]);

  return {
    refreshSubscriptions
  };
};
