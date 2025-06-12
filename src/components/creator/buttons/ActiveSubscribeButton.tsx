
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const { createSubscription, isProcessing } = useCreateSubscription();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    if (isProcessing) return;

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
        return;
      }

      // The createSubscription hook should navigate to /payment automatically
      // But let's add a fallback just in case
      if (result?.clientSecret) {
        console.log('[ActiveSubscribeButton] Navigating to payment page');
        navigate('/payment', {
          state: {
            clientSecret: result.clientSecret,
            amount: Math.round(price * 100),
            tierName: tierName,
            tierId: tierId,
            creatorId: creatorId
          }
        });
      }

    } catch (error) {
      console.error('[ActiveSubscribeButton] Error:', error);
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isProcessing}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      size="lg"
    >
      {isProcessing ? (
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
