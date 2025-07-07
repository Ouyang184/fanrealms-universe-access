import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const { createSubscription, isProcessing } = useCreateSubscription();
  const { toast } = useToast();
  const [isButtonLocked, setIsButtonLocked] = useState(false);

  const handleSubscribe = async () => {
    console.log('[ActiveSubscribeButton] Subscribe button clicked', {
      tierId,
      creatorId,
      tierName,
      price,
      userId: user?.id,
      userEmail: user?.email,
      isButtonLocked,
      isProcessing
    });

    if (!user) {
      console.log('[ActiveSubscribeButton] No user authenticated');
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    // Prevent double submissions
    if (isButtonLocked || isProcessing) {
      console.log('[ActiveSubscribeButton] Button locked or processing, preventing double submission');
      return;
    }

    setIsButtonLocked(true);
    console.log('[ActiveSubscribeButton] Starting subscription creation...');
    
    try {
      const result = await createSubscription({ 
        tierId, 
        creatorId 
      });
      
      console.log('[ActiveSubscribeButton] CreateSubscription result:', result);
      
      if (result?.error) {
        console.log('[ActiveSubscribeButton] Error from createSubscription:', result.error);
        // Error already handled in hook
        return;
      }
      
      console.log('[ActiveSubscribeButton] Subscription creation successful, should have redirected to payment');
      
      // If we get here, the user was redirected to payment page
      // Keep button locked for a bit to prevent rapid clicking
      setTimeout(() => {
        setIsButtonLocked(false);
        console.log('[ActiveSubscribeButton] Button unlocked after timeout');
      }, 3000);
      
    } catch (error) {
      console.error('[ActiveSubscribeButton] Subscription error:', error);
      setIsButtonLocked(false);
    }
  };

  const isDisabled = isProcessing || isButtonLocked;

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isDisabled}
      className="w-full"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Starting payment...
        </>
      ) : isButtonLocked ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Subscribe for $${price}/month`
      )}
    </Button>
  );
}
