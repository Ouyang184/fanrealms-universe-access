
import React from 'react';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useCreatorStripeStatus } from '@/hooks/useCreatorStripeStatus';
import { SubscribedButton } from './buttons/SubscribedButton';
import { PaymentUnavailableButton } from './buttons/PaymentUnavailableButton';
import { ActiveSubscribeButton } from './buttons/ActiveSubscribeButton';
import { ManualCancelButton } from './buttons/ManualCancelButton';

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
  const { subscriptionStatus } = useSubscriptionCheck(tierId, creatorId);
  const { isCreatorStripeReady } = useCreatorStripeStatus(creatorId);

  const isUserSubscribed = subscriptionStatus?.isSubscribed || isSubscribed;

  if (isUserSubscribed) {
    return (
      <div className="space-y-2">
        <SubscribedButton
          tierName={tierName}
          subscriptionData={subscriptionStatus?.data}
          tierId={tierId}
          creatorId={creatorId}
          onOptimisticUpdate={onOptimisticUpdate}
          onSubscriptionSuccess={onSubscriptionSuccess}
        />
        <ManualCancelButton creatorId={creatorId} />
      </div>
    );
  }

  if (!isCreatorStripeReady) {
    return <PaymentUnavailableButton />;
  }

  return (
    <div className="space-y-2">
      <ActiveSubscribeButton
        tierId={tierId}
        creatorId={creatorId}
        tierName={tierName}
        price={price}
      />
      {/* Show manual cancel button for debugging if needed */}
      <ManualCancelButton creatorId={creatorId} />
    </div>
  );
}
