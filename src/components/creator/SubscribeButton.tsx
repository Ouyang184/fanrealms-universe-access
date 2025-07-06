
import React from 'react';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { useCreatorStripeStatus } from '@/hooks/useCreatorStripeStatus';
import { SubscribedButton } from './buttons/SubscribedButton';
import { PaymentUnavailableButton } from './buttons/PaymentUnavailableButton';
import { SimpleSubscribeButton } from './buttons/SimpleSubscribeButton';

interface SubscribeButtonProps {
  tierId: string;
  creatorId: string;
  tierName: string;
  price: number;
  isSubscribed?: boolean;
  subscriptionData?: any;
  onSubscriptionSuccess?: () => void;
  onOptimisticUpdate?: (isSubscribed: boolean) => void;
}

export function SubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price, 
  isSubscribed = false,
  subscriptionData: externalSubscriptionData,
  onSubscriptionSuccess,
  onOptimisticUpdate
}: SubscribeButtonProps) {
  const { subscriptionData, isLoading } = useSimpleSubscriptionCheck(tierId, creatorId);
  const { isCreatorStripeReady } = useCreatorStripeStatus(creatorId);

  // Use external subscription data if provided, otherwise use hook data
  const finalSubscriptionData = externalSubscriptionData || subscriptionData;
  
  // Use subscription check result with proper validation
  const isUserSubscribed = finalSubscriptionData?.isSubscribed ?? isSubscribed;

  console.log('[SubscribeButton] Render state:', {
    tierId,
    creatorId,
    tierName,
    isSubscribedProp: isSubscribed,
    subscriptionData: finalSubscriptionData,
    hookIsSubscribed: subscriptionData?.isSubscribed,
    finalIsUserSubscribed: isUserSubscribed,
    isLoading,
    isCreatorStripeReady
  });

  if (isLoading) {
    return (
      <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
    );
  }

  // Check subscription status properly
  const subscription = finalSubscriptionData?.subscription || finalSubscriptionData;
  
  // Check if user has an active subscription (including those scheduled to cancel but still in period)
  if (subscription && (subscription.status === 'active' || subscription.isActive)) {
    console.log('[SubscribeButton] Showing SubscribedButton - user has active subscription');
    return (
      <SubscribedButton
        tierName={tierName}
        subscriptionData={subscription}
        tierId={tierId}
        creatorId={creatorId}
        onOptimisticUpdate={onOptimisticUpdate}
        onSubscriptionSuccess={onSubscriptionSuccess}
      />
    );
  }

  // Fallback check for isUserSubscribed
  if (isUserSubscribed) {
    console.log('[SubscribeButton] Showing SubscribedButton - fallback for subscribed user');
    return (
      <SubscribedButton
        tierName={tierName}
        subscriptionData={subscription}
        tierId={tierId}
        creatorId={creatorId}
        onOptimisticUpdate={onOptimisticUpdate}
        onSubscriptionSuccess={onSubscriptionSuccess}
      />
    );
  }

  if (!isCreatorStripeReady) {
    console.log('[SubscribeButton] Showing PaymentUnavailableButton - Stripe not ready');
    return <PaymentUnavailableButton />;
  }

  console.log('[SubscribeButton] Showing SimpleSubscribeButton - no active subscription');
  return (
    <SimpleSubscribeButton
      tierId={tierId}
      creatorId={creatorId}
      tierName={tierName}
      price={price}
    />
  );
}
