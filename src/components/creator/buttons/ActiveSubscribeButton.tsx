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
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    // Prevent double submissions
    if (isButtonLocked || isProcessing) {
      return;
    }

    setIsButtonLocked(true);
    
    try {
      const result = await createSubscription({ 
        tierId, 
        creatorId 
      });
      
      if (result?.error) {
        // Error already handled in hook
        return;
      }
      
      // If we get here, the user was redirected to payment page
      // Keep button locked for a bit to prevent rapid clicking
      setTimeout(() => {
        setIsButtonLocked(false);
      }, 3000);
      
    } catch (error) {
      console.error('Subscription error:', error);
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
