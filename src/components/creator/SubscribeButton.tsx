
import React, { useEffect, useState } from 'react';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useCreatorStripeStatus } from '@/hooks/useCreatorStripeStatus';
import { SubscribedButton } from './buttons/SubscribedButton';
import { PaymentUnavailableButton } from './buttons/PaymentUnavailableButton';
import { ActiveSubscribeButton } from './buttons/ActiveSubscribeButton';

interface SubscribeButtonProps {
  tierId: string;
  creatorId: string;
  tierName: string;
  price: number;
  isSubscribed?: boolean;
  onSubscriptionSuccess?: () => void;
  onOptimisticUpdate?: (isSubscribed: boolean) => void;
}

export function SubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price, 
  isSubscribed = false,
  onSubscriptionSuccess,
  onOptimisticUpdate
}: SubscribeButtonProps) {
  const { subscriptionStatus, refetch } = useSubscriptionCheck(tierId, creatorId);
  const { isCreatorStripeReady } = useCreatorStripeStatus(creatorId);
  const [optimisticSubscribed, setOptimisticSubscribed] = useState<boolean | null>(null);

  // Listen for subscription events to refresh data
  useEffect(() => {
    const handleSubscriptionEvent = async () => {
      console.log('SubscribeButton: Subscription event detected, refreshing...');
      await refetch();
      setOptimisticSubscribed(null); // Clear optimistic state
    };

    window.addEventListener('subscriptionCanceled', handleSubscriptionEvent);
    window.addEventListener('subscriptionSuccess', handleSubscriptionEvent);
    window.addEventListener('paymentSuccess', handleSubscriptionEvent);

    return () => {
      window.removeEventListener('subscriptionCanceled', handleSubscriptionEvent);
      window.removeEventListener('subscriptionSuccess', handleSubscriptionEvent);
      window.removeEventListener('paymentSuccess', handleSubscriptionEvent);
    };
  }, [refetch]);

  const handleOptimisticUpdate = (subscribed: boolean) => {
    setOptimisticSubscribed(subscribed);
    if (onOptimisticUpdate) {
      onOptimisticUpdate(subscribed);
    }
  };

  // Use optimistic state if available, otherwise use actual subscription status
  const isUserSubscribed = optimisticSubscribed !== null 
    ? optimisticSubscribed 
    : subscriptionStatus?.isSubscribed || isSubscribed;

  if (isUserSubscribed) {
    return (
      <SubscribedButton
        tierName={tierName}
        subscriptionData={subscriptionStatus?.data}
        tierId={tierId}
        creatorId={creatorId}
        onOptimisticUpdate={handleOptimisticUpdate}
        onSubscriptionSuccess={onSubscriptionSuccess}
      />
    );
  }

  if (!isCreatorStripeReady) {
    return <PaymentUnavailableButton />;
  }

  return (
    <ActiveSubscribeButton
      tierId={tierId}
      creatorId={creatorId}
      tierName={tierName}
      price={price}
    />
  );
}
