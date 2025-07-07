
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCreateSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockedSubscriptions, setLockedSubscriptions] = useState(new Set<string>());

  const createSubscription = useCallback(async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    if (!user || isProcessing) {
      console.log('Cannot create subscription: user not authenticated or already processing');
      return null;
    }

    const lockKey = `${user.id}-${creatorId}-${tierId}`;
    
    // Check if this subscription is locked (already being processed)
    if (lockedSubscriptions.has(lockKey)) {
      console.log('Subscription already being processed for:', lockKey);
      toast({
        title: "Payment in Progress",
        description: "Please wait, your payment is already being processed.",
        variant: "default"
      });
      return null;
    }

    // Lock this subscription
    setLockedSubscriptions(prev => new Set(prev).add(lockKey));
    setIsProcessing(true);
    
    console.log('useCreateSubscription: Starting subscription creation for:', { tierId, creatorId, userId: user.id });
    
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'create_subscription',
          tierId: tierId,
          creatorId: creatorId
        }
      });

      console.log('useCreateSubscription: Edge function response:', { data, error });

      if (error) {
        console.error('useCreateSubscription: Edge function error:', error);
        throw new Error(error.message || 'Failed to invoke subscription function');
      }

      if (data?.error) {
        console.error('useCreateSubscription: Function returned error:', data.error);
        toast({
          title: "Subscription Error",
          description: data.error,
          variant: "destructive"
        });
        return { 
          error: data.error,
          shouldRefresh: data.shouldRefresh || false
        };
      }

      if (!data) {
        console.error('useCreateSubscription: No data returned from function');
        throw new Error('No response from subscription service');
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        console.log('useCreateSubscription: Redirecting to Stripe Checkout');
        
        toast({
          title: data.isUpgrade ? "Processing Upgrade" : "Starting Subscription",
          description: "Redirecting you to secure payment...",
        });
        
        // Small delay to show the toast, then redirect
        setTimeout(() => {
          window.location.href = data.checkout_url;
        }, 1000);
        
        return data;
      }

      console.log('useCreateSubscription: Subscription creation successful');
      return data;

    } catch (error) {
      console.error('useCreateSubscription: Failed to create subscription:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
      // Unlock after a delay to prevent rapid clicking
      setTimeout(() => {
        setLockedSubscriptions(prev => {
          const newSet = new Set(prev);
          newSet.delete(lockKey);
          return newSet;
        });
      }, 2000);
    }
  }, [user, isProcessing, toast, lockedSubscriptions]);

  // Function to clear any locks when needed
  const clearSubscriptionLock = useCallback((tierId: string, creatorId: string) => {
    if (!user) return;
    
    const lockKey = `${user.id}-${creatorId}-${tierId}`;
    setLockedSubscriptions(prev => {
      const newSet = new Set(prev);
      newSet.delete(lockKey);
      return newSet;
    });
    console.log('Cleared subscription lock for:', lockKey);
  }, [user]);

  return {
    createSubscription,
    isProcessing,
    setIsProcessing,
    clearSubscriptionLock
  };
};
