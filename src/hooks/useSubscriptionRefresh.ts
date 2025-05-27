
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSubscriptionRefresh = (refetchFunction?: () => Promise<void>) => {
  const queryClient = useQueryClient();

  const refreshSubscriptions = useCallback(async () => {
    try {
      console.log('Refreshing all subscription-related queries...');
      
      // Invalidate all subscription-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
        queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['active-subscribers'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] }),
      ]);

      // Call the provided refetch function if available
      if (refetchFunction) {
        await refetchFunction();
      }

      console.log('All subscription queries refreshed');
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
      throw error;
    }
  }, [queryClient, refetchFunction]);

  return { refreshSubscriptions };
};
