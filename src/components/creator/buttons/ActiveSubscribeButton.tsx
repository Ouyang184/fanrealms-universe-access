
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useSubscriptionEventManager } from '@/hooks/useSubscriptionEventManager';

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
  const { createSubscription, isCreating } = useSubscriptions();
  const { subscriptionStatus, isLoading, refetch } = useSubscriptionCheck(tierId, creatorId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invalidateAllSubscriptionQueries } = useSubscriptionEventManager();

  // Force refresh on mount and when user changes
  React.useEffect(() => {
    if (user?.id && tierId && creatorId) {
      console.log('ActiveSubscribeButton: Checking subscription status on mount');
      refetch();
    }
  }, [user?.id, tierId, creatorId, refetch]);

  // Listen for subscription success events
  React.useEffect(() => {
    const handleSubscriptionSuccess = async () => {
      console.log('Subscription success event detected, refetching...');
      await Promise.all([
        refetch(),
        invalidateAllSubscriptionQueries()
      ]);
    };

    window.addEventListener('subscriptionSuccess', handleSubscriptionSuccess);
    window.addEventListener('paymentSuccess', handleSubscriptionSuccess);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionSuccess);
      window.removeEventListener('paymentSuccess', handleSubscriptionSuccess);
    };
  }, [refetch, invalidateAllSubscriptionQueries]);

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking subscription...
      </Button>
    );
  }

  // Show debug info if subscription exists but user thinks they can't subscribe
  if (subscriptionStatus?.isSubscribed) {
    console.log('User already has active subscription:', subscriptionStatus.subscription);
    return (
      <div className="space-y-2">
        <Button variant="outline" className="w-full" size="lg" disabled>
          Already Subscribed to {tierName}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Active since {subscriptionStatus.subscription?.created_at ? 
            new Date(subscriptionStatus.subscription.created_at).toLocaleDateString() : 'recently'}
        </p>
      </div>
    );
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    // Double-check subscription status before proceeding
    console.log('Double-checking subscription status before creating new subscription');
    const freshStatus = await refetch();
    if (freshStatus.data?.isSubscribed) {
      console.log('User is already subscribed, preventing duplicate subscription');
      toast({
        title: "Already Subscribed",
        description: "You already have an active subscription to this tier.",
      });
      return;
    }

    try {
      console.log('Starting subscription creation for tier:', tierId, 'creator:', creatorId);
      
      createSubscription({ tierId, creatorId }, {
        onSuccess: (data) => {
          if (data?.clientSecret) {
            console.log('Redirecting to payment page with client secret');
            navigate('/payment', {
              state: {
                clientSecret: data.clientSecret,
                amount: price * 100,
                tierName,
                tierId,
                creatorId
              }
            });
          } else if (data?.error) {
            console.log('Subscription creation returned error:', data.error);
            
            // If error mentions existing subscription, refresh data
            if (data.error.toLowerCase().includes('already') || data.error.toLowerCase().includes('subscribed')) {
              toast({
                title: "Already Subscribed",
                description: "You already have an active subscription to this tier.",
              });
              refetch();
              invalidateAllSubscriptionQueries();
            } else {
              toast({
                title: "Error",
                description: data.error,
                variant: "destructive"
              });
            }
          }
        }
      });
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isCreating}
      className="w-full"
      size="lg"
    >
      {isCreating ? (
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
