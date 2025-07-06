
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSimpleSubscriptions } from '@/hooks/useSimpleSubscriptions';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SimpleSubscribeButtonProps {
  tierId: string;
  creatorId: string;
  tierName: string;
  price: number;
}

export function SimpleSubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price 
}: SimpleSubscribeButtonProps) {
  const { user } = useAuth();
  const { createSubscription, isProcessing } = useSimpleSubscriptions();
  const { subscriptionData } = useSimpleSubscriptionCheck(tierId, creatorId);
  const { toast } = useToast();

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
      const result = await createSubscription({ 
        tierId, 
        creatorId 
      });
      
      if (result?.error) {
        return; // Error already handled in hook
      }
      
      if (result?.url) {
        // Open Stripe checkout in a new tab
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  if (subscriptionData?.isSubscribed) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        Already Subscribed
      </Button>
    );
  }

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
