
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SubscribeButtonProps {
  tierId: string;
  creatorId: string;
  tierName: string;
  price: number;
  isSubscribed?: boolean;
  onSubscriptionSuccess?: () => void;
}

export function SubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price, 
  isSubscribed = false,
  onSubscriptionSuccess
}: SubscribeButtonProps) {
  const { user } = useAuth();
  const { createSubscription, cancelSubscription, isProcessing, setIsProcessing } = useStripeSubscription();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [localSubscriptionState, setLocalSubscriptionState] = useState(isSubscribed);

  // Check if user is subscribed to this specific tier with very aggressive refresh
  const { data: userSubscription, refetch: refetchUserSubscription } = useQuery({
    queryKey: ['userTierSubscription', user?.id, tierId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('SubscribeButton: Checking subscription for user:', user.id, 'tier:', tierId);
      
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('SubscribeButton: Error checking subscription:', error);
        return null;
      }
      
      console.log('SubscribeButton: Subscription check result for tier', tierId, ':', data);
      return data;
    },
    enabled: !!user?.id && !!tierId,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 1000, // Every second for real-time updates
  });

  // Update local state when subscription data changes
  useEffect(() => {
    const newSubscriptionState = userSubscription !== null || isSubscribed;
    if (newSubscriptionState !== localSubscriptionState) {
      console.log('SubscribeButton: Updating local subscription state for tier', tierId, ':', newSubscriptionState);
      setLocalSubscriptionState(newSubscriptionState);
    }
  }, [userSubscription, isSubscribed, tierId, localSubscriptionState]);

  // Listen for subscription events and force refresh immediately
  useEffect(() => {
    const handleSubscriptionUpdate = async () => {
      console.log('SubscribeButton: Subscription update event detected, refreshing tier subscription data...');
      
      // Invalidate all related queries immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      ]);
      
      // Force immediate refetch
      await refetchUserSubscription();
      
      // Update local state immediately
      const freshData = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (freshData.data) {
        console.log('SubscribeButton: Found fresh subscription data, updating state');
        setLocalSubscriptionState(true);
      }
      
      // Trigger the callback if provided
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
    };

    const handlePaymentSuccess = async () => {
      console.log('SubscribeButton: Payment success detected');
      await handleSubscriptionUpdate();
    };

    window.addEventListener('subscriptionSuccess', handleSubscriptionUpdate);
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    window.addEventListener('subscriptionCanceled', handleSubscriptionUpdate);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionUpdate);
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionUpdate);
    };
  }, [queryClient, refetchUserSubscription, onSubscriptionSuccess, user?.id, tierId]);

  // Check if creator has completed Stripe setup
  const { data: creatorStripeStatus } = useQuery({
    queryKey: ['creatorStripeStatus', creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled')
        .eq('id', creatorId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId
  });

  const isCreatorStripeReady = creatorStripeStatus?.stripe_account_id && 
                              creatorStripeStatus?.stripe_onboarding_complete && 
                              creatorStripeStatus?.stripe_charges_enabled;

  const handleSubscribe = async () => {
    console.log('SubscribeButton: Subscribe button clicked', { tierId, creatorId, tierName, price });
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    if (!isCreatorStripeReady) {
      toast({
        title: "Subscription unavailable",
        description: "This creator hasn't completed their payment setup yet.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('SubscribeButton: Creating subscription...');
      const result = await createSubscription({ tierId, creatorId });
      console.log('SubscribeButton: Subscription creation result:', result);
      
      if (result?.clientSecret) {
        console.log('SubscribeButton: Navigating to payment page with clientSecret');
        // Store the success callback in sessionStorage to avoid serialization issues
        if (onSubscriptionSuccess) {
          sessionStorage.setItem('subscriptionSuccessCallback', 'true');
          sessionStorage.setItem('subscriptionCreatorId', creatorId);
          sessionStorage.setItem('subscriptionTierId', tierId);
        }
        
        // Navigate to payment page with subscription details
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
        console.error('SubscribeButton: No clientSecret received:', result);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('SubscribeButton: Subscription error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!userSubscription) return;

    setIsUnsubscribing(true);
    
    try {
      await cancelSubscription(userSubscription.id);
      
      // Force immediate state update
      setLocalSubscriptionState(false);
      
      // Invalidate and refetch subscription data immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      ]);
      await refetchUserSubscription();
      
      toast({
        title: "Success",
        description: "Successfully unsubscribed from this tier.",
      });
      
      // Trigger refresh if callback is provided
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
    } catch (error) {
      console.error('SubscribeButton: Unsubscribe error:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  // Use local state that gets updated more aggressively
  const isUserSubscribed = localSubscriptionState;

  console.log('SubscribeButton: Render state', { 
    tierId, 
    isUserSubscribed, 
    localSubscriptionState, 
    userSubscription: !!userSubscription,
    isSubscribed 
  });

  if (isUserSubscribed) {
    return (
      <div className="space-y-2">
        <Button variant="outline" disabled className="w-full">
          <Check className="mr-2 h-4 w-4 text-green-500" />
          Subscribed to {tierName}
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          className="w-full"
          onClick={handleUnsubscribe}
          disabled={isUnsubscribing}
        >
          {isUnsubscribing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Unsubscribing...
            </>
          ) : (
            'Unsubscribe'
          )}
        </Button>
      </div>
    );
  }

  if (!isCreatorStripeReady) {
    return (
      <Button variant="outline" disabled className="w-full">
        <AlertCircle className="mr-2 h-4 w-4" />
        Payments not set up
      </Button>
    );
  }

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
