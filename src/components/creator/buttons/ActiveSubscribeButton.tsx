
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
        
        // Check if it's an existing subscription error
        if (result.error.includes('already have an active subscription') || 
            result.error.includes('existing subscription') ||
            result.shouldRefresh) {
          
          // Refresh all subscription-related data immediately
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
            queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] }),
            queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers', creatorId] }),
            queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
            queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
          ]);

          toast({
            title: "Already Subscribed",
            description: "You already have an active subscription to this creator. The page will refresh to show your current subscription status.",
          });
          
          // Force a page refresh after a short delay to ensure UI updates
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } else {
          // Show other error messages normally
          toast({
            title: "Subscription Error",
            description: result.error,
            variant: "destructive"
          });
        }
        return;
      }
      
      if (result?.clientSecret) {
        // Store subscription details for payment page
        sessionStorage.setItem('pendingSubscription', JSON.stringify({
          tierId,
          creatorId,
          tierName,
          price
        }));
        
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
      } else if (result?.subscriptionId) {
        // Direct subscription success (shouldn't happen with Stripe, but handle it)
        console.log('ActiveSubscribeButton: Direct subscription success');
        
        // Refresh subscription data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers', creatorId] }),
          queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
        ]);

        toast({
          title: "Subscription Successful!",
          description: `You are now subscribed to ${tierName}.`,
        });
      } else {
        console.error('ActiveSubscribeButton: Unexpected result format:', result);
        toast({
          title: "Error",
          description: "Unable to create subscription. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('ActiveSubscribeButton: Subscription error:', error);
      
      // Handle the case where we have an existing subscription but it threw an error
      if (error instanceof Error && error.message.includes('already have an active subscription')) {
        // Refresh all subscription-related data immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers', creatorId] }),
          queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
          queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
        ]);

        toast({
          title: "Already Subscribed",
          description: "You already have an active subscription to this creator. The page will refresh to show your current subscription status.",
        });
        
        // Force a page refresh after a short delay to ensure UI updates
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }
      
      // Extract a meaningful error message
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
          Creating subscription...
        </>
      ) : (
        `Subscribe for $${price}/month`
      )}
    </Button>
  );
}
