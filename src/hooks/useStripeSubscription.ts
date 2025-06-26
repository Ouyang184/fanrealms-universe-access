
import { useUserSubscriptions } from '@/hooks/stripe/useUserSubscriptions';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';
import { useCancelSubscription } from '@/hooks/stripe/useCancelSubscription';
import { useSubscriptionRefresh } from '@/hooks/stripe/useSubscriptionRefresh';

export const useStripeSubscription = () => {
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useUserSubscriptions();
  const { createSubscription, isProcessing, setIsProcessing } = useCreateSubscription();
  
  // Wrap refetchSubscriptions to match expected signature
  const wrappedRefetchSubscriptions = async () => {
    await refetchSubscriptions();
  };
  
  const { refreshSubscriptions } = useSubscriptionRefresh(wrappedRefetchSubscriptions);
  const { cancelSubscription, isCancelling } = useCancelSubscription(wrappedRefetchSubscriptions);

  return {
    userSubscriptions,
    subscriptionsLoading,
    isCancelling,
    isProcessing,
    setIsProcessing,
    createSubscription,
    cancelSubscription,
    refetchSubscriptions: refreshSubscriptions,
  };
};
