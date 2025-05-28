
import React from 'react';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
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
  const { subscriptionData, isLoading } = useSimpleSubscriptionCheck(tierId, creatorId);
  const { isCreatorStripeReady } = useCreatorStripeStatus(creatorId);

  // Use the passed isSubscribed prop first, then fall back to subscription check
  const isUserSubscribed = isSubscribed || subscriptionData?.isSubscribed || false;

  console.log('SubscribeButton debug:', {
    tierId,
    creatorId,
    tierName,
    isSubscribedProp: isSubscribed,
    subscriptionDataFromHook: subscriptionData?.isSubscribed,
    finalIsUserSubscribed: isUserSubscribed,
    subscriptionData: subscriptionData,
    isLoading
  });

  if (isLoading) {
    return (
      <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
    );
  }

  if (isUserSubscribed) {
    console.log('Showing SubscribedButton for tier:', tierId);
    return (
      <SubscribedButton
        tierName={tierName}
        subscriptionData={subscriptionData?.subscription}
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

  console.log('Showing ActiveSubscribeButton for tier:', tierId);
  return (
    <ActiveSubscribeButton
      tierId={tierId}
      creatorId={creatorId}
      tierName={tierName}
      price={price}
    />
  );
}
