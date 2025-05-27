
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

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
      console.log('ActiveSubscribeButton: Starting subscription creation for tier:', tierId, 'creator:', creatorId, 'user:', user.id);
      
      const result = await createSubscription({ tierId, creatorId });
      console.log('ActiveSubscribeButton: Subscription creation result:', result);
      
      if (result?.error) {
        console.error('ActiveSubscribeButton: Server returned error:', result.error);
        
        if (result.shouldRefresh) {
          console.log('ActiveSubscribeButton: Refreshing subscription data due to existing subscription');
          
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
            queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] }),
            queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers', creatorId] }),
            queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
            queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
            queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
          ]);

          toast({
            title: "Already Subscribed",
            description: "You already have an active subscription to this tier.",
          });
          
          window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
            detail: { tierId, creatorId, tierName }
          }));
          
        } else {
          toast({
            title: "Subscription Error",
            description: result.error,
            variant: "destructive"
          });
        }
        return;
      }
      
      // This should ALWAYS navigate to payment page - never create subscription directly
      if (result?.clientSecret) {
        console.log('ActiveSubscribeButton: Navigating to payment page with client secret');
        navigate('/payment', {
          state: {
            clientSecret: result.clientSecret,
            amount: price * 100, // Convert to cents
            tierName,
            tierId,
            creatorId
          }
        });
      } else {
        console.error('ActiveSubscribeButton: No client secret received - this should not happen');
        toast({
          title: "Error",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('ActiveSubscribeButton: Subscription error:', error);
      
      let errorMessage = "Failed to create subscription. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

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
          Starting payment...
        </>
      ) : (
        `Subscribe for $${price}/month`
      )}
    </Button>
  );
}
