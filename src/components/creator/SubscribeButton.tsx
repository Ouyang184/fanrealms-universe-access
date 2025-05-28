
import React from 'react';
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
  const { subscriptionStatus, isLoading } = useSubscriptionCheck(tierId, creatorId);
  const { isCreatorStripeReady } = useCreatorStripeStatus(creatorId);

  // Use the passed isSubscribed prop or fallback to subscription check
  const isUserSubscribed = isSubscribed || subscriptionStatus?.isSubscribed || false;

  console.log('SubscribeButton debug:', {
    tierId,
    creatorId,
    isSubscribed,
    subscriptionStatusFromHook: subscriptionStatus?.isSubscribed,
    isUserSubscribed,
    subscriptionData: subscriptionStatus?.subscription
  });

  if (isLoading) {
    return (
      <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
    );
  }

  if (isUserSubscribed) {
    return (
      <SubscribedButton
        tierName={tierName}
        subscriptionData={subscriptionStatus?.subscription}
        tierId={tierId}
        creatorId={creatorId}
        onOptimisticUpdate={onOptimisticUpdate}
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
