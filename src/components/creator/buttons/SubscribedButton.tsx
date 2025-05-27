
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

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
  const { cancelSubscription } = useStripeSubscription();
  const queryClient = useQueryClient();
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const handleUnsubscribe = async () => {
    if (!subscriptionData) {
      console.log('No subscription data available for cancellation');
      toast({
        title: "Error",
        description: "No subscription found to cancel.",
        variant: "destructive"
      });
      return;
    }

    setIsUnsubscribing(true);
    
    try {
      console.log('SubscribedButton: Cancelling subscription:', subscriptionData.id);
      
      const subscriptionId = subscriptionData.id;
      await cancelSubscription(subscriptionId);
      
      console.log('SubscribedButton: Subscription cancelled successfully');
      
      if (onOptimisticUpdate) {
        onOptimisticUpdate(false);
      }
      
      window.dispatchEvent(new CustomEvent('subscriptionCanceled', {
        detail: { creatorId, tierId, subscriptionId }
      }));
      
      toast({
        title: "Success",
        description: "Successfully unsubscribed from this tier.",
      });
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
      ]);
      
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
    } catch (error) {
      console.error('SubscribedButton: Unsubscribe error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unsubscribe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" disabled className="w-full">
        <Check className="mr-2 h-4 w-4 text-green-500" />
        Subscribed to {tierName}
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        className="w-full"
        onClick={handleUnsubscribe}
        disabled={isUnsubscribing}
      >
        {isUnsubscribing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Unsubscribing...
          </>
        ) : (
          'Cancel Subscription'
        )}
      </Button>
    </div>
  );
}
