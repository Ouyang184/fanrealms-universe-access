
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  const { createSubscription, isProcessing } = useCreateSubscription();
  const { toast } = useToast();
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
      
      // Check if it's the "already subscribed" error
      if (error instanceof Error && error.message.includes('already have an active subscription')) {
        toast({
          title: "Already Subscribed",
          description: "You already have an active subscription to this creator.",
          variant: "default"
        });
        
        // Trigger a refresh of subscription data
        window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
          detail: { tierId, creatorId, tierName }
        }));
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create subscription. Please try again.",
          variant: "destructive"
        });
      }
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
