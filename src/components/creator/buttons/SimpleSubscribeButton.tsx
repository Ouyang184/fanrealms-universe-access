
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpRight } from 'lucide-react';
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
  userSubscriptions?: any[];
}

export function SimpleSubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price,
  userSubscriptions = []
}: SimpleSubscribeButtonProps) {
  const { user } = useAuth();
  const { createSubscription, isProcessing } = useSimpleSubscriptions();
  const { subscriptionData } = useSimpleSubscriptionCheck(tierId, creatorId);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user has subscription to this specific tier
  const currentTierSubscription = userSubscriptions.find(sub => 
    sub.tier_id === tierId && sub.creator_id === creatorId && sub.status === 'active'
  );

  // Check if user has subscription to any other tier for this creator
  const otherTierSubscription = userSubscriptions.find(sub => 
    sub.tier_id !== tierId && sub.creator_id === creatorId && sub.status === 'active'
  );

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
            amount: result.amount || price * 100,
            tierName,
            tierId,
            creatorId,
            isUpgrade: result.isUpgrade,
            existingTierCredit: result.existingTierCredit
          }
        });
      } else if (result?.success) {
        // Downgrade case - no payment needed
        toast({
          title: "Tier Changed Successfully",
          description: `You've successfully switched to ${tierName}`,
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  // If user is subscribed to this exact tier
  if (currentTierSubscription || subscriptionData?.isSubscribed) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        Current Plan
      </Button>
    );
  }

  // Determine button text and styling based on subscription status
  let buttonText = `Subscribe for $${price}/month`;
  let buttonVariant: "default" | "outline" = "default";
  let buttonIcon = null;

  if (otherTierSubscription) {
    const isUpgrade = price > otherTierSubscription.amount;
    buttonText = isUpgrade ? `Upgrade to ${tierName}` : `Switch to ${tierName}`;
    buttonVariant = isUpgrade ? "default" : "outline";
    buttonIcon = isUpgrade ? <ArrowUpRight className="ml-2 h-4 w-4" /> : null;
  }

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isProcessing}
      className="w-full"
      size="lg"
      variant={buttonVariant}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {otherTierSubscription ? 'Switching tier...' : 'Starting payment...'}
        </>
      ) : (
        <>
          {buttonText}
          {buttonIcon}
        </>
      )}
    </Button>
  );
}
