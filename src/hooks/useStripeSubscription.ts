
import { useUserSubscriptions } from '@/hooks/stripe/useUserSubscriptions';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';
import { useCancelSubscription } from '@/hooks/stripe/useCancelSubscription';
import { useSubscriptionRefresh } from '@/hooks/stripe/useSubscriptionRefresh';

export const useStripeSubscription = () => {
  const { userSubscriptions, subscriptionsLoading, refetchSubscriptions } = useUserSubscriptions();
  const { createSubscription, isProcessing, setIsProcessing } = useCreateSubscription();
  const { refreshSubscriptions } = useSubscriptionRefresh(refetchSubscriptions);
  const { cancelSubscription, isOperating } = useCancelSubscription(refetchSubscriptions);

  return {
    userSubscriptions,
    subscriptionsLoading,
    isOperating,
    isProcessing,
    setIsProcessing,
    createSubscription,
    cancelSubscription,
    refetchSubscriptions: refreshSubscriptions,
  };
};
