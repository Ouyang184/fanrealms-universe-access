
import React from 'react';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { useCreatorStripeStatus } from '@/hooks/useCreatorStripeStatus';
import { SubscribedButton } from './buttons/SubscribedButton';
import { PaymentUnavailableButton } from './buttons/PaymentUnavailableButton';
import { ActiveSubscribeButton } from './buttons/ActiveSubscribeButton';
import { Button } from '@/components/ui/button';
import { Calendar, Lock } from 'lucide-react';

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
  
  // Use subscription check result with fallback to prop
  const isUserSubscribed = finalSubscriptionData?.isSubscribed ?? isSubscribed;

  // Helper function to format date
  const formatCancelDate = (dateString: string | number) => {
    let date;
    if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  // Enhanced subscription logic with proper cancellation handling
  const subscription = finalSubscriptionData?.subscription || finalSubscriptionData;
  
  if (subscription) {
    const isActive = subscription.status === 'active';
    // Use the enhanced cancellation check from our subscription data
    const isScheduledToCancel = subscription.isScheduledToCancel || 
                              (subscription.cancel_at_period_end === true &&
                               subscription.current_period_end && 
                               new Date(subscription.current_period_end) > new Date());

    console.log('[SubscribeButton] Enhanced subscription check:', {
      isActive,
      isScheduledToCancel,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end,
      enhancedFlag: subscription.isScheduledToCancel
    });

    if (isActive) {
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
  }

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

  console.log('[SubscribeButton] Showing ActiveSubscribeButton - no active subscription');
  return (
    <ActiveSubscribeButton
      tierId={tierId}
      creatorId={creatorId}
      tierName={tierName}
      price={price}
    />
  );
}
