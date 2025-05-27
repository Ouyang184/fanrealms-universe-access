
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface SubscribedButtonProps {
  tierName: string;
  subscriptionData: any;
  tierId: string;
  creatorId: string;
  onOptimisticUpdate?: (isSubscribed: boolean) => void;
  onSubscriptionSuccess?: () => void;
}

export function SubscribedButton({ 
  tierName, 
  subscriptionData, 
  tierId, 
  creatorId,
  onOptimisticUpdate,
  onSubscriptionSuccess 
}: SubscribedButtonProps) {
  // Use separate state for cancellation to avoid conflicts
  const [isCancelling, setIsCancelling] = useState(false);
  const queryClient = useQueryClient();

  // Check if subscription is in cancelling state
  const isCancellingState = subscriptionData?.isCancelling || subscriptionData?.status === 'cancelling';
  const cancelAt = subscriptionData?.cancelAt || subscriptionData?.cancel_at;

  const formatCancelDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleUnsubscribe = async () => {
    if (!subscriptionData || isCancelling) {
      console.log('No subscription data available for cancellation or already cancelling');
      toast({
        title: "Error",
        description: "No subscription found to cancel.",
        variant: "destructive"
      });
      return;
    }

    setIsCancelling(true);
    
    try {
      console.log('SubscribedButton: Cancelling subscription:', subscriptionData.id);
      
      // Call the edge function to cancel subscription
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'cancel_subscription',
          subscriptionId: subscriptionData.id
        }
      });

      if (error) {
        console.error('SubscribedButton: Error from edge function:', error);
        throw error;
      }

      if (data?.error) {
        console.error('SubscribedButton: Server returned error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('SubscribedButton: Subscription cancelled successfully');
      
      // Immediately update optimistic state
      if (onOptimisticUpdate) {
        onOptimisticUpdate(false);
      }
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('subscriptionCanceled', {
        detail: { creatorId, tierId, subscriptionId: subscriptionData.id }
      }));
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      
      // Invalidate all subscription-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
      ]);
      
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
    } catch (error) {
      console.error('SubscribedButton: Unsubscribe error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unsubscribe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isCancellingState && cancelAt) {
    return (
      <div className="space-y-2">
        <Button variant="outline" disabled className="w-full">
          <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
          Cancelling at Period End
        </Button>
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            <Calendar className="mr-1 h-3 w-3" />
            Active until {formatCancelDate(cancelAt)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          You'll retain access to {tierName} until your billing period ends.
        </p>
      </div>
    );
  }

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
        disabled={isCancelling}
      >
        {isCancelling ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cancelling...
          </>
        ) : (
          'Cancel Subscription'
        )}
      </Button>
    </div>
  );
}
