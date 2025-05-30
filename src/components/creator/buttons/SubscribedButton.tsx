
import React from 'react';
import { CancellationWarningState } from './components/CancellationWarningState';
import { ActiveSubscriptionState } from './components/ActiveSubscriptionState';
import { InactiveSubscriptionState } from './components/InactiveSubscriptionState';
import { useSubscriptionActions } from './hooks/useSubscriptionActions';
import { getNextBillingDate } from './utils/dateFormatters';

interface SubscribedButtonProps {
  tierName: string;
  subscriptionData: any;
  tierId: string;
  creatorId: string;
  onOptimisticUpdate?: (isSubscribed: boolean) => void;
  onSubscriptionSuccess?: () => void;
}

export function SubscribedButton({ 
  tierName, 
  subscriptionData, 
  tierId, 
  creatorId,
  onOptimisticUpdate,
  onSubscriptionSuccess 
}: SubscribedButtonProps) {
  const subscription = subscriptionData;
  
  // Simplified logic - just check if subscription is active
  const isActive = subscription?.status === 'active';
  const willCancel = subscription?.cancel_at_period_end === true;

  console.log('SubscribedButton - Status check:', {
    subscription,
    isActive,
    willCancel,
    status: subscription?.status,
    cancel_at_period_end: subscription?.cancel_at_period_end,
    current_period_end: subscription?.current_period_end
  });

  const { handleReactivate, handleUnsubscribe } = useSubscriptionActions({
    tierName,
    tierId,
    creatorId,
    subscription,
    onOptimisticUpdate,
    onSubscriptionSuccess
  });

  // Show UI for subscriptions that will cancel
  if (isActive && willCancel) {
    const cancelDate = subscription.current_period_end || getNextBillingDate(subscription);
    return (
      <CancellationWarningState
        tierName={tierName}
        cancelDate={cancelDate}
        onReactivate={handleReactivate}
      />
    );
  }

  // Show normal subscribed state with cancel button
  if (isActive) {
    const nextBillingDate = getNextBillingDate(subscription);
    return (
      <ActiveSubscriptionState
        tierName={tierName}
        nextBillingDate={nextBillingDate}
        onCancel={handleUnsubscribe}
      />
    );
  }

  // Fallback for inactive subscriptions
  return <InactiveSubscriptionState />;
}
