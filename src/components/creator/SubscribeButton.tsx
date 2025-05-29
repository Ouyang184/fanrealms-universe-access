
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

  // Helper function to format date
  const formatCancelDate = (dateString: string | number) => {
    let date;
    if (typeof dateString === 'number') {
      // Handle UNIX timestamp
      date = new Date(dateString * 1000);
    } else {
      date = new Date(dateString);
    }
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if subscription is in cancelling state but still active
  const subscription = finalSubscriptionData?.subscription || finalSubscriptionData;
  const isCancellingState = subscription?.status === 'cancelling' || 
                           subscription?.cancel_at_period_end === true ||
                           subscription?.cancel_at_period_end;
  
  const cancelAt = subscription?.cancel_at || 
                  subscription?.current_period_end ||
                  (subscription?.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null);

  if (isLoading) {
    return (
      <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
    );
  }

  // Check if subscription is cancelled and the cancellation date has passed
  if (isCancellingState && cancelAt) {
    const cancelDate = new Date(typeof cancelAt === 'number' ? cancelAt * 1000 : cancelAt);
    const currentDate = new Date();
    
    if (currentDate >= cancelDate) {
      // Subscription has ended, show regular subscribe button
      console.log('[SubscribeButton] Subscription has ended, showing ActiveSubscribeButton');
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
    } else {
      // Subscription is scheduled to cancel but still active - show "Can Subscribe again" button
      console.log('[SubscribeButton] Subscription scheduled to cancel, showing disabled button');
      return (
        <Button 
          disabled 
          className="w-full bg-gray-300 text-gray-600 cursor-not-allowed"
        >
          <Lock className="mr-2 h-4 w-4" />
          Can Subscribe again on {formatCancelDate(cancelAt)}
        </Button>
      );
    }
  }

  if (isUserSubscribed) {
    console.log('[SubscribeButton] Showing SubscribedButton - user has active subscription');
    // Pass the actual subscription object directly, ensuring it has all the status information
    const subscriptionWithData = finalSubscriptionData?.subscription || finalSubscriptionData;
    
    return (
      <SubscribedButton
        tierName={tierName}
        subscriptionData={subscriptionWithData}
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
