
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSimpleSubscriptions } from '@/hooks/useSimpleSubscriptions';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SimpleSubscribeButtonProps {
  tierId: string;
  creatorId: string;
  tierName: string;
  price: number;
}

export function SimpleSubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price 
}: SimpleSubscribeButtonProps) {
  const { user } = useAuth();
  const { createSubscription, isProcessing } = useSimpleSubscriptions();
  const { subscriptionData } = useSimpleSubscriptionCheck(tierId, creatorId);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[SimpleSubscribeButton] Creating subscription for tier:', tierId, 'creator:', creatorId);
      
      const result = await createSubscription({ 
        tierId, 
        creatorId 
      });
      
      if (result?.error) {
        console.error('[SimpleSubscribeButton] Subscription error:', result.error);
        // Error already handled in hook
        return;
      }
      
      if (result?.url) {
        console.log('[SimpleSubscribeButton] Redirecting to Stripe Checkout:', result.url);
        // Open Stripe checkout in a new tab
        window.open(result.url, '_blank');
        
        toast({
          title: "Redirecting to Payment",
          description: "Please complete your payment to activate the subscription.",
        });
      } else {
        console.error('[SimpleSubscribeButton] No checkout URL received');
        toast({
          title: "Error",
          description: "Failed to create checkout session. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[SimpleSubscribeButton] Subscription error:', error);
      // Error already handled in hook, just log here
    }
  };

  if (subscriptionData?.isSubscribed) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        Already Subscribed
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isProcessing}
      className="w-full"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating checkout...
        </>
      ) : (
        `Subscribe for $${price}/month`
      )}
    </Button>
  );
}
