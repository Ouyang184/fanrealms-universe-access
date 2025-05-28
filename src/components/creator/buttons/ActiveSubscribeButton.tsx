
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

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
  const { subscriptionStatus, isLoading } = useSubscriptionCheck(tierId, creatorId);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Don't show subscribe button if already subscribed
  if (subscriptionStatus?.isSubscribed) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        Already Subscribed to {tierName}
      </Button>
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
            toast({
              title: "Already Subscribed",
              description: data.error,
            });
          }
        }
      });
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking subscription...
      </Button>
    );
  }

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
