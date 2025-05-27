
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
      } else if (result?.subscriptionId) {
        // Direct subscription success - refresh all data immediately
        console.log('ActiveSubscribeButton: Direct subscription success, refreshing data');
        
        // Invalidate all subscription-related queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
          queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
        ]);

        // Force refetch with no cache
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['userActiveSubscriptions'] }),
          queryClient.refetchQueries({ queryKey: ['creatorMembershipTiers', creatorId] }),
        ]);

        // Trigger global subscription events
        window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
          detail: { tierId, creatorId, tierName, subscriptionId: result.subscriptionId }
        }));

        toast({
          title: "Subscription Successful!",
          description: `You are now subscribed to ${tierName}.`,
        });
      } else {
        console.error('ActiveSubscribeButton: Unexpected result format');
        toast({
          title: "Error",
          description: "Subscription creation completed but status is unclear. Please refresh the page.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('ActiveSubscribeButton: Subscription error:', error);
      
      // Check if it's the "already subscribed" error
      if (error instanceof Error && error.message.includes('already have an active subscription')) {
        // Force refresh subscription data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers', creatorId] }),
        ]);

        toast({
          title: "Already Subscribed",
          description: "You already have an active subscription to this creator.",
          variant: "default"
        });
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
