
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSimpleSubscriptions } from '@/hooks/useSimpleSubscriptions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActiveSubscribeButtonProps {
  tierId: string;
  creatorId: string;
  tierName: string;
  price: number;
}

export function ActiveSubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price 
}: ActiveSubscribeButtonProps) {
  const { createSubscription, isProcessing } = useSimpleSubscriptions();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (isProcessing || isRedirecting) return;

    setIsRedirecting(true);
    console.log('[ActiveSubscribeButton] Starting subscription process for tier:', tierId);

    try {
      const result = await createSubscription({ tierId, creatorId });
      
      if (result?.error) {
        console.log('[ActiveSubscribeButton] Subscription error:', result.error);
        toast({
          title: "Subscription Error",
          description: result.error,
          variant: "destructive"
        });
        setIsRedirecting(false);
        return;
      }

      if (result?.checkout_url) {
        console.log('[ActiveSubscribeButton] Redirecting to Stripe Checkout:', result.checkout_url);
        toast({
          title: "Redirecting to Payment",
          description: result.action === 'tier_change' 
            ? "Taking you to checkout to change your subscription tier..."
            : "Taking you to checkout to complete your subscription...",
        });
        
        // Redirect to Stripe Checkout
        window.location.href = result.checkout_url;
      } else {
        console.error('[ActiveSubscribeButton] No checkout URL received');
        toast({
          title: "Subscription Error",
          description: "Failed to create checkout session. Please try again.",
          variant: "destructive"
        });
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('[ActiveSubscribeButton] Error:', error);
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsRedirecting(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isProcessing || isRedirecting}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      size="lg"
    >
      {isProcessing || isRedirecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isRedirecting ? 'Redirecting...' : 'Processing...'}
        </>
      ) : (
        `Subscribe for $${price}/month`
      )}
    </Button>
  );
}
