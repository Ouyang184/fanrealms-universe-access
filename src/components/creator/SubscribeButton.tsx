
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
  onOptimisticUpdate?: (isSubscribed: boolean) => void;
}

export function SubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price, 
  isSubscribed = false,
  onSubscriptionSuccess,
  onOptimisticUpdate
}: SubscribeButtonProps) {
  const { user } = useAuth();
  const { createSubscription, cancelSubscription, isProcessing, setIsProcessing } = useStripeSubscription();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [localSubscriptionState, setLocalSubscriptionState] = useState(isSubscribed);

  // Check if user is subscribed to this specific tier with aggressive refresh
  const { data: userSubscription, refetch: refetchUserSubscription } = useQuery({
    queryKey: ['userTierSubscription', user?.id, tierId],
    queryFn: async () => {
      if (!user?.id) return null;
      
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
      
      return data;
    },
    enabled: !!user?.id && !!tierId,
    staleTime: 0,
    refetchInterval: 1000,
  });

  // Update local state when subscription data changes
  useEffect(() => {
    const newSubscriptionState = userSubscription !== null || isSubscribed;
    if (newSubscriptionState !== localSubscriptionState) {
      setLocalSubscriptionState(newSubscriptionState);
    }
  }, [userSubscription, isSubscribed, localSubscriptionState]);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionUpdate = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
      ]);
      
      await refetchUserSubscription();
      
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
    };

    window.addEventListener('subscriptionSuccess', handleSubscriptionUpdate);
    window.addEventListener('paymentSuccess', handleSubscriptionUpdate);
    window.addEventListener('subscriptionCanceled', handleSubscriptionUpdate);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionUpdate);
      window.removeEventListener('paymentSuccess', handleSubscriptionUpdate);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionUpdate);
    };
  }, [queryClient, refetchUserSubscription, onSubscriptionSuccess]);

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

    // Optimistic update
    setLocalSubscriptionState(true);
    if (onOptimisticUpdate) {
      onOptimisticUpdate(true);
    }

    setIsProcessing(true);

    try {
      const result = await createSubscription({ tierId, creatorId });
      
      if (result?.clientSecret) {
        // Store subscription details for post-payment handling
        sessionStorage.setItem('pendingSubscription', JSON.stringify({
          tierId,
          creatorId,
          tierName
        }));
        
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
        // Revert optimistic update on error
        setLocalSubscriptionState(false);
        if (onOptimisticUpdate) {
          onOptimisticUpdate(false);
        }
        
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalSubscriptionState(false);
      if (onOptimisticUpdate) {
        onOptimisticUpdate(false);
      }
      
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

    // Optimistic update
    setLocalSubscriptionState(false);
    if (onOptimisticUpdate) {
      onOptimisticUpdate(false);
    }

    setIsUnsubscribing(true);
    
    try {
      await cancelSubscription(userSubscription.id);
      
      // Dispatch cancellation event
      window.dispatchEvent(new CustomEvent('subscriptionCanceled', {
        detail: { creatorId, tierId }
      }));
      
      toast({
        title: "Success",
        description: "Successfully unsubscribed from this tier.",
      });
      
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalSubscriptionState(true);
      if (onOptimisticUpdate) {
        onOptimisticUpdate(true);
      }
      
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

  const isUserSubscribed = localSubscriptionState;

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
            'Cancel Subscription'
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
