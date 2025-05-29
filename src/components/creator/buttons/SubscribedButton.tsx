
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Calendar, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionEventManager } from '@/hooks/useSubscriptionEventManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const queryClient = useQueryClient();
  const { triggerSubscriptionCancellation, invalidateAllSubscriptionQueries } = useSubscriptionEventManager();

  const subscription = subscriptionData;
  
  // Check if subscription is active or scheduled to cancel
  const isActive = subscription?.status === 'active';
  const isScheduledToCancel = subscription?.cancel_at_period_end === true &&
                            subscription?.current_period_end && 
                            new Date(subscription.current_period_end) > new Date();

  console.log('SubscribedButton - Status check:', {
    subscription,
    isActive,
    isScheduledToCancel,
    status: subscription?.status,
    cancel_at_period_end: subscription?.cancel_at_period_end,
    current_period_end: subscription?.current_period_end
  });

  const formatCancelDate = (dateString: string | number) => {
    let date;
    if (typeof dateString === 'number') {
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

  const getNextBillingDate = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return formatCancelDate(nextMonth.toISOString());
  };

  const handleReactivate = async () => {
    if (isReactivating) {
      console.log('Already reactivating, ignoring click');
      return;
    }

    const subscriptionId = subscription?.stripe_subscription_id || 
                          subscription?.id || 
                          subscription?.subscription_id;

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

    const subscriptionId = subscription?.stripe_subscription_id || 
                          subscription?.id || 
                          subscription?.subscription_id;

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
        
        const nextBillingDate = getNextBillingDate();
        
        toast({
          title: "Subscription Will End",
          description: `Your subscription to ${tierName} will automatically end on ${nextBillingDate}. You'll continue to have access until then.`,
        });
        
        if (onOptimisticUpdate) {
          onOptimisticUpdate(false);
        }
        
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
        setShowCancelDialog(false);
      }
      return;
    }

    setIsCancelling(true);
    
    try {
      console.log('SubscribedButton: Setting subscription to cancel at period end:', subscriptionId);
      
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
      
      triggerSubscriptionCancellation({
        creatorId, 
        tierId, 
        subscriptionId: subscriptionId
      });
      
      const cancelDate = data.cancelAt ? formatCancelDate(data.cancelAt) : getNextBillingDate();
      
      toast({
        title: "Subscription Will End",
        description: `Your subscription to ${tierName} will automatically end on ${cancelDate}. You'll continue to have access until then.`,
      });
      
      if (onOptimisticUpdate) {
        onOptimisticUpdate(false);
      }
      
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
      setShowCancelDialog(false);
    }
  };

  // Show UI for subscriptions scheduled to cancel
  if (isActive && isScheduledToCancel) {
    const cancelDate = subscription.current_period_end;
    return (
      <div className="space-y-3">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Subscription will end on {formatCancelDate(cancelDate)}</span>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-300">
              <Calendar className="mr-1 h-3 w-3" />
              Active until {formatCancelDate(cancelDate)}
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
          Reactivate your subscription to continue enjoying {tierName} benefits beyond {formatCancelDate(cancelDate)}.
        </p>
      </div>
    );
  }

  // Show normal subscribed state with cancel button
  if (isActive) {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center">
            <Check className="mr-2 h-4 w-4 text-green-600" />
            <span className="text-green-800 font-medium">Subscribed to {tierName}</span>
          </div>
        </div>
        
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
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
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your subscription to <strong>{tierName}</strong>? 
                <br /><br />
                Your subscription will automatically end on <strong>{getNextBillingDate()}</strong>. 
                You'll continue to have access to all {tierName} benefits until then.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleUnsubscribe}
                className="bg-red-600 hover:bg-red-700"
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
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Fallback for inactive subscriptions
  return (
    <div className="text-gray-500 text-center p-4">
      Not subscribed
    </div>
  );
}
