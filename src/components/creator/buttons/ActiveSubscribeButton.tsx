
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
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
  const { user } = useAuth();
  const { createSubscription, isProcessing, setIsProcessing } = useStripeSubscription();
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

    setIsProcessing(true);

    try {
      console.log('ActiveSubscribeButton: Creating subscription for tier:', tierId, 'creator:', creatorId);
      const result = await createSubscription({ tierId, creatorId });
      
      if (result?.clientSecret) {
        sessionStorage.setItem('pendingSubscription', JSON.stringify({
          tierId,
          creatorId,
          tierName
        }));
        
        console.log('ActiveSubscribeButton: Navigating to payment with client secret');
        navigate('/payment', {
          state: {
            clientSecret: result.clientSecret,
            amount: price * 100,
            tierName,
            tierId,
            creatorId
          }
        });
      } else {
        console.error('ActiveSubscribeButton: No client secret received');
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('ActiveSubscribeButton: Subscription error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isProcessing}
      className="w-full"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Subscribe to ${tierName} - $${price}/month`
      )}
    </Button>
  );
}
