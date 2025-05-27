
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
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Check if user is subscribed to this specific tier with aggressive refresh
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
        setDebugInfo(prev => ({ ...prev, subscriptionError: error.message }));
        return null;
      }
      
      console.log('SubscribeButton: Subscription data:', data);
      setDebugInfo(prev => ({ ...prev, subscriptionData: data, lastChecked: new Date().toISOString() }));
      
      return data;
    },
    enabled: !!user?.id && !!tierId,
    staleTime: 0,
    refetchInterval: 3000, // Check every 3 seconds
  });

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionUpdate = async (event: CustomEvent) => {
      console.log('SubscribeButton: Received subscription event:', event.type, event.detail);
      setDebugInfo(prev => ({ ...prev, lastEvent: { type: event.type, detail: event.detail, time: new Date().toISOString() } }));
      
      if ((event.type === 'paymentSuccess' || event.type === 'subscriptionSuccess') && 
          event.detail?.tierId === tierId && event.detail?.creatorId === creatorId) {
        
        console.log('SubscribeButton: Payment successful, updating button state');
        
        if (onOptimisticUpdate) {
          onOptimisticUpdate(true);
        }
        
        // Force immediate refresh of subscription data
        setTimeout(async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
            queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
            queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
          ]);
          
          await refetchUserSubscription();
        }, 1000);
        
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess();
        }
      } else if (event.type === 'subscriptionCanceled' && 
                 event.detail?.tierId === tierId && event.detail?.creatorId === creatorId) {
        
        console.log('SubscribeButton: Subscription canceled, updating button state');
        
        if (onOptimisticUpdate) {
          onOptimisticUpdate(false);
        }
        
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
          queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        ]);
        
        await refetchUserSubscription();
        
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess();
        }
      }
    };

    window.addEventListener('subscriptionSuccess', handleSubscriptionUpdate as EventListener);
    window.addEventListener('paymentSuccess', handleSubscriptionUpdate as EventListener);
    window.addEventListener('subscriptionCanceled', handleSubscriptionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionUpdate as EventListener);
      window.removeEventListener('paymentSuccess', handleSubscriptionUpdate as EventListener);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionUpdate as EventListener);
    };
  }, [queryClient, refetchUserSubscription, onSubscriptionSuccess, onOptimisticUpdate, tierId, creatorId]);

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

    setIsProcessing(true);
    setDebugInfo(prev => ({ ...prev, subscriptionAttempt: new Date().toISOString() }));

    try {
      console.log('SubscribeButton: Creating subscription for tier:', tierId, 'creator:', creatorId);
      const result = await createSubscription({ tierId, creatorId });
      
      setDebugInfo(prev => ({ ...prev, createResult: result }));
      
      if (result?.clientSecret) {
        sessionStorage.setItem('pendingSubscription', JSON.stringify({
          tierId,
          creatorId,
          tierName
        }));
        
        console.log('SubscribeButton: Navigating to payment with client secret');
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
        console.error('SubscribeButton: No client secret received');
        setDebugInfo(prev => ({ ...prev, error: 'No client secret received' }));
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('SubscribeButton: Subscription error:', error);
      setDebugInfo(prev => ({ ...prev, error: error instanceof Error ? error.message : String(error) }));
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

  // Manual refresh function for debugging
  const handleManualRefresh = async () => {
    console.log('SubscribeButton: Manual refresh triggered');
    setDebugInfo(prev => ({ ...prev, manualRefresh: new Date().toISOString() }));
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
    ]);
    
    await refetchUserSubscription();
  };

  const isUserSubscribed = userSubscription !== null || isSubscribed;

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
        
        {/* Debug info for troubleshooting */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs bg-muted p-2 rounded">
            <summary>Debug Info (Dev Only)</summary>
            <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            <Button size="sm" variant="outline" onClick={handleManualRefresh} className="mt-2">
              Refresh Status
            </Button>
          </details>
        )}
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
    <div className="space-y-2">
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
      
      {/* Debug info for troubleshooting */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs bg-muted p-2 rounded">
          <summary>Debug Info (Dev Only)</summary>
          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
          <Button size="sm" variant="outline" onClick={handleManualRefresh} className="mt-2">
            Refresh Status
          </Button>
        </details>
      )}
    </div>
  );
}
