
import { useUserSubscriptions } from '@/hooks/stripe/useUserSubscriptions';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';
import { useCancelSubscription } from '@/hooks/stripe/useCancelSubscription';
import { useSubscriptionRefresh } from '@/hooks/stripe/useSubscriptionRefresh';
import { useAuth } from '@/contexts/AuthContext';

export const useStripeSubscription = () => {
  const { user } = useAuth();
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch } = useUserSubscriptions(user?.id);
  const { createSubscription, isProcessing, setIsProcessing } = useCreateSubscription();
  
  // Wrap refetch to match expected signature
  const wrappedRefetchSubscriptions = async () => {
    await refetch();
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
