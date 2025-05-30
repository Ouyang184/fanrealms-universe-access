
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useSubscriptionEventManager } from '@/hooks/useSubscriptionEventManager';
import { formatCancelDate, getNextBillingDate } from '../utils/dateFormatters';

interface UseSubscriptionActionsProps {
  tierName: string;
  tierId: string;
  creatorId: string;
  subscription: any;
  onOptimisticUpdate?: (isSubscribed: boolean) => void;
  onSubscriptionSuccess?: () => void;
}

export function useSubscriptionActions({
  tierName,
  tierId,
  creatorId,
  subscription,
  onOptimisticUpdate,
  onSubscriptionSuccess
}: UseSubscriptionActionsProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const { triggerSubscriptionCancellation, invalidateAllSubscriptionQueries } = useSubscriptionEventManager();

  const handleReactivate = async () => {
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
        
        const nextBillingDate = getNextBillingDate(subscription);
        
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
      
      const cancelDate = data.cancelAt ? formatCancelDate(data.cancelAt) : getNextBillingDate(subscription);
      
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
    }
  };

  return {
    handleReactivate,
    handleUnsubscribe,
    isCancelling,
    isReactivating
  };
}
