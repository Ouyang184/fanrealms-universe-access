import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Calendar, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionEventManager } from '@/hooks/useSubscriptionEventManager';

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const queryClient = useQueryClient();
  const { triggerSubscriptionCancellation, invalidateAllSubscriptionQueries } = useSubscriptionEventManager();

  // Check if subscription is in cancelling state - updated logic
  const isCancellingState = subscriptionData?.status === 'cancelling' || 
                           subscriptionData?.cancel_at_period_end === true ||
                           subscriptionData?.cancel_at_period_end;
  
  const cancelAt = subscriptionData?.cancel_at || 
                  subscriptionData?.current_period_end ||
                  (subscriptionData?.current_period_end ? new Date(subscriptionData.current_period_end * 1000).toISOString() : null);

  const formatCancelDate = (dateString: string | number) => {
    let date;
    if (typeof dateString === 'number') {
      // Handle UNIX timestamp
      date = new Date(dateString * 1000);
    } else {
      date = new Date(dateString);
    }
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleReactivate = async () => {
    if (isReactivating) {
      console.log('Already reactivating, ignoring click');
      return;
    }

    const subscriptionId = subscriptionData?.stripe_subscription_id || 
                          subscriptionData?.id || 
                          subscriptionData?.subscription_id;

    if (!subscriptionId) {
      toast({
        title: "Error",
        description: "No subscription ID found. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    setIsReactivating(true);
    
    try {
      console.log('Reactivating subscription:', subscriptionId);
      
      // Call the edge function to reactivate subscription
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'reactivate_subscription',
          subscriptionId: subscriptionId
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Server returned error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('Subscription reactivated successfully:', data);
      
      toast({
        title: "Subscription Reactivated",
        description: `Your subscription to ${tierName} has been reactivated and will continue.`,
      });
      
      // Invalidate all subscription-related queries
      await invalidateAllSubscriptionQueries();
      
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
    } catch (error) {
      console.error('Reactivate subscription error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reactivate subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (isCancelling) {
      console.log('Already cancelling, ignoring click');
      return;
    }

    const subscriptionId = subscriptionData?.stripe_subscription_id || 
                          subscriptionData?.id || 
                          subscriptionData?.subscription_id;

    if (!subscriptionId) {
      console.log('No subscription ID found, trying to cancel via simple-subscriptions');
      
      try {
        setIsCancelling(true);
        
        const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
          body: {
            action: 'cancel_subscription',
            tierId: tierId,
            creatorId: creatorId
          }
        });

        if (error) {
          console.error('Error from simple-subscriptions:', error);
          throw error;
        }

        if (data?.error) {
          console.error('Server returned error:', data.error);
          throw new Error(data.error);
        }

        console.log('Successfully set subscription to cancel at period end via simple-subscriptions');
        
        // Update optimistic state to show cancelling
        if (onOptimisticUpdate) {
          onOptimisticUpdate(false);
        }
        
        // Trigger subscription cancellation events
        triggerSubscriptionCancellation({
          creatorId, 
          tierId, 
          subscriptionId: 'unknown'
        });
        
        toast({
          title: "Subscription Will End",
          description: `Your subscription to ${tierName} will end on your next billing date. You'll continue to have access until then.`,
        });
        
        // Invalidate all subscription-related queries
        await invalidateAllSubscriptionQueries();
        
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess();
        }
        
        return;
      } catch (error) {
        console.error('Error with simple-subscriptions:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to cancel subscription. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsCancelling(false);
      }
      return;
    }

    setIsCancelling(true);
    
    try {
      console.log('SubscribedButton: Setting subscription to cancel at period end:', subscriptionId);
      
      // Call the edge function to set subscription to cancel at period end
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'cancel_subscription',
          subscriptionId: subscriptionId
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
      
      console.log('SubscribedButton: Subscription set to cancel at period end successfully:', data);
      
      // Trigger subscription cancellation events
      triggerSubscriptionCancellation({
        creatorId, 
        tierId, 
        subscriptionId: subscriptionId
      });
      
      toast({
        title: "Subscription Will End",
        description: `Your subscription to ${tierName} will end on your next billing date. You'll continue to have access until then.`,
      });
      
      // Invalidate all subscription-related queries
      await invalidateAllSubscriptionQueries();
      
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
    } catch (error) {
      console.error('SubscribedButton: Cancel subscription error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isCancellingState && cancelAt) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Subscription will end on {formatCancelDate(cancelAt)}</span>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-300">
              <Calendar className="mr-1 h-3 w-3" />
              Active until {formatCancelDate(cancelAt)}
            </Badge>
          </div>
        </div>
        
        <Button 
          variant="default" 
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={handleReactivate}
          disabled={isReactivating}
        >
          {isReactivating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reactivating...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reactivate before this date
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Reactivate your subscription to continue enjoying {tierName} benefits beyond {formatCancelDate(cancelAt)}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-center">
          <Check className="mr-2 h-4 w-4 text-green-600" />
          <span className="text-green-800 font-medium">Subscribed to {tierName}</span>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full border-red-200 text-red-600 hover:bg-red-50"
        onClick={handleUnsubscribe}
        disabled={isCancelling}
      >
        {isCancelling ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Cancel Subscription'
        )}
      </Button>
    </div>
  );
}
