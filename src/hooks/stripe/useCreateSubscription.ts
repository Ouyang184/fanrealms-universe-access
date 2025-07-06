
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Cache for payment sessions to prevent duplicate creations
const sessionCache = new Map<string, {
  clientSecret: string;
  amount: number;
  tierName: string;
  tierId: string;
  creatorId: string;
  timestamp: number;
  isUpgrade?: boolean;
  currentTierName?: string;
  proratedAmount?: number;
  fullTierPrice?: number;
}>();

const SESSION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useCreateSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockedSubscriptions, setLockedSubscriptions] = useState(new Set<string>());

  const createSubscription = useCallback(async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    if (!user || isProcessing) {
      console.log('Cannot create subscription: user not authenticated or already processing');
      return null;
    }

    // Validate required fields
    if (!tierId || !creatorId) {
      console.error('useCreateSubscription: Missing required fields:', { tierId, creatorId });
      toast({
        title: "Invalid Request",
        description: "Missing required subscription information. Please try again.",
        variant: "destructive"
      });
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

    // Check cache first
    const cacheKey = `${user.id}-${creatorId}-${tierId}`;
    const cachedSession = sessionCache.get(cacheKey);
    
    if (cachedSession && (Date.now() - cachedSession.timestamp) < SESSION_CACHE_DURATION) {
      console.log('useCreateSubscription: Using cached session for:', cacheKey);
      
      // Navigate to payment page with cached data
      navigate('/payment', {
        state: {
          clientSecret: cachedSession.clientSecret,
          amount: cachedSession.amount,
          tierName: cachedSession.tierName,
          tierId: cachedSession.tierId,
          creatorId: cachedSession.creatorId,
          isUpgrade: cachedSession.isUpgrade,
          currentTierName: cachedSession.currentTierName,
          proratedAmount: cachedSession.proratedAmount,
          fullTierPrice: cachedSession.fullTierPrice
        }
      });
      
      return cachedSession;
    }

    // Lock this subscription
    setLockedSubscriptions(prev => new Set(prev).add(lockKey));
    setIsProcessing(true);
    
    console.log('useCreateSubscription: Starting subscription creation for:', { tierId, creatorId, userId: user.id });
    
    try {
      const requestPayload = {
        action: 'create_subscription',
        tierId: tierId,
        creatorId: creatorId
      };

      console.log('useCreateSubscription: Sending request payload:', requestPayload);

      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: requestPayload
      });

      console.log('useCreateSubscription: Edge function response:', { data, error });

      if (error) {
        console.error('useCreateSubscription: Edge function error:', error);
        
        // Show more specific error messages
        let errorMessage = 'Failed to create subscription. Please try again.';
        if (error.message) {
          if (error.message.includes('authentication')) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.message.includes('configuration')) {
            errorMessage = 'Payment system configuration error. Please contact support.';
          } else if (error.message.includes('Stripe')) {
            errorMessage = `Payment error: ${error.message}`;
          } else {
            errorMessage = error.message;
          }
        }

        toast({
          title: "Subscription Failed",
          description: errorMessage,
          variant: "destructive"
        });

        return { error: errorMessage };
      }

      if (data?.error) {
        console.error('useCreateSubscription: Function returned error:', data.error);
        
        toast({
          title: "Subscription Error",
          description: data.error,
          variant: data.shouldRefresh ? "default" : "destructive"
        });

        return { 
          error: data.error,
          shouldRefresh: data.shouldRefresh || false
        };
      }

      if (!data) {
        console.error('useCreateSubscription: No data returned from function');
        toast({
          title: "Subscription Failed",
          description: "No response from subscription service. Please try again.",
          variant: "destructive"
        });
        return { error: 'No response from subscription service' };
      }

      // Check if we should use custom payment page
      if (data.useCustomPaymentPage && data.clientSecret) {
        console.log('useCreateSubscription: Navigating to custom payment page');
        
        // Cache the session data
        const sessionData = {
          clientSecret: data.clientSecret,
          amount: data.amount,
          tierName: data.tierName,
          tierId: data.tierId,
          creatorId: data.creatorId,
          timestamp: Date.now(),
          isUpgrade: data.isUpgrade,
          currentTierName: data.currentTierName,
          proratedAmount: data.proratedAmount,
          fullTierPrice: data.fullTierPrice
        };
        
        sessionCache.set(cacheKey, sessionData);
        
        // Set cache cleanup
        setTimeout(() => {
          sessionCache.delete(cacheKey);
        }, SESSION_CACHE_DURATION);

        navigate('/payment', {
          state: {
            clientSecret: data.clientSecret,
            amount: data.amount,
            tierName: data.tierName,
            tierId: data.tierId,
            creatorId: data.creatorId,
            isUpgrade: data.isUpgrade,
            currentTierName: data.currentTierName,
            proratedAmount: data.proratedAmount,
            fullTierPrice: data.fullTierPrice
          }
        });
        
        // Show appropriate message
        if (data.reusedSession) {
          toast({
            title: "Returning to Payment",
            description: "Returning you to your existing payment session.",
          });
        } else {
          toast({
            title: "Redirecting to Payment",
            description: "Please complete your payment to activate the subscription.",
          });
        }
        
        return data;
      }

      // Handle successful subscription creation
      if (data.success || data.subscriptionId) {
        console.log('useCreateSubscription: Subscription creation successful');
        
        toast({
          title: data.isUpgrade ? "Subscription Updated!" : "Subscription Created!",
          description: data.message || (data.isUpgrade ? "Your subscription tier has been updated." : "Your subscription is now active."),
        });

        return data;
      }

      // Fallback case
      console.log('useCreateSubscription: Unexpected response format:', data);
      return data;

    } catch (error) {
      console.error('useCreateSubscription: Unexpected error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return { error: errorMessage };
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
  }, [user, isProcessing, navigate, toast, lockedSubscriptions]);

  // Function to clear cache when user cancels payment
  const clearSubscriptionCache = useCallback((tierId: string, creatorId: string) => {
    if (!user) return;
    
    const cacheKey = `${user.id}-${creatorId}-${tierId}`;
    sessionCache.delete(cacheKey);
    console.log('Cleared subscription cache for:', cacheKey);
  }, [user]);

  return {
    createSubscription,
    isProcessing,
    setIsProcessing,
    clearSubscriptionCache
  };
};
