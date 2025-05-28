
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
}

export function SimpleSubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price 
}: SimpleSubscribeButtonProps) {
  const { user } = useAuth();
  const { createSubscription, isProcessing } = useSimpleSubscriptions();
  const { subscriptionStatus } = useSimpleSubscriptionCheck(tierId, creatorId);
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

  if (subscriptionStatus?.isSubscribed) {
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
