
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
  
  // FIXED: Use subscription check result with proper validation
  const isUserSubscribed = finalSubscriptionData?.isSubscribed ?? isSubscribed;


  if (isLoading) {
    return (
      <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
    );
  }

  // FIXED: Check subscription status properly
  const subscription = finalSubscriptionData?.subscription || finalSubscriptionData;
  
  // Check if user has an active subscription (including those scheduled to cancel but still in period)
  if (subscription && (subscription.status === 'active' || subscription.isActive)) {
    
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
