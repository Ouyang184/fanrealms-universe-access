
import React from 'react';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useCreatorStripeStatus } from '@/hooks/useCreatorStripeStatus';
import { SubscribedButton } from './buttons/SubscribedButton';
import { PaymentUnavailableButton } from './buttons/PaymentUnavailableButton';
import { ActiveSubscribeButton } from './buttons/ActiveSubscribeButton';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

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
  const isPendingPayment = subscriptionStatus?.isPendingPayment;

  // Show pending payment state
  if (isPendingPayment) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Clock className="mr-2 h-4 w-4 text-orange-500" />
        Payment Pending
      </Button>
    );
  }

  if (isUserSubscribed) {
    return (
      <SubscribedButton
        tierName={tierName}
        subscriptionData={subscriptionStatus?.data}
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
