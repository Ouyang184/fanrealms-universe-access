
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSimpleSubscriptions } from '@/hooks/useSimpleSubscriptions';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SimpleSubscribeButtonProps {
  tierId: string;
  creatorId: string;
  tierName: string;
  price: number;
  currentSubscription?: any;
}

export function SimpleSubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price,
  currentSubscription 
}: SimpleSubscribeButtonProps) {
  const { user } = useAuth();
  const { createSubscription, isProcessing } = useSimpleSubscriptions();
  const { subscriptionData } = useSimpleSubscriptionCheck(tierId, creatorId);
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
      const result = await createSubscription({ tierId, creatorId });
      
      if (result?.error) {
        return; // Error already handled in hook
      }
      
      // Check if this is a tier switch with checkout URL
      if (result?.checkoutUrl) {
        toast({
          title: "Switching Tier",
          description: `Redirecting to checkout to switch to ${tierName}...`,
        });
        
        // Open Stripe checkout in new tab
        window.open(result.checkoutUrl, '_blank');
        return;
      }
      
      // Regular subscription with payment intent
      if (result?.clientSecret) {
        navigate('/payment', {
          state: {
            clientSecret: result.clientSecret,
            amount: price * 100,
            tierName,
            tierId,
            creatorId
          }
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  // Check if user is subscribed to this exact tier
  if (subscriptionData?.isSubscribed && subscriptionData?.subscription?.tier_id === tierId) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        Already Subscribed
      </Button>
    );
  }

  // Check if user has a subscription to this creator (different tier)
  const hasCreatorSubscription = currentSubscription && currentSubscription.creator_id === creatorId;
  const buttonText = hasCreatorSubscription 
    ? `Switch to ${tierName} - $${price}/month`
    : `Subscribe for $${price}/month`;

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
          {hasCreatorSubscription ? 'Switching tier...' : 'Starting payment...'}
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}
