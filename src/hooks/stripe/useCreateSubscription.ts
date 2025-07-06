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

// Helper function for consistent logging
const log = (step: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [useCreateSubscription] ${step}`);
  if (data) {
    console.log(`[${timestamp}] [useCreateSubscription] Data:`, JSON.stringify(data, null, 2));
  }
};

export const useCreateSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockedSubscriptions, setLockedSubscriptions] = useState(new Set<string>());

  const createSubscription = useCallback(async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    log('Starting subscription creation', { tierId, creatorId, userId: user?.id });

    if (!user || isProcessing) {
      log('Cannot create subscription: user not authenticated or already processing');
      return null;
    }

    // Validate required fields
    if (!tierId || !creatorId) {
      log('Missing required fields', { tierId, creatorId });
      toast({
        title: "Invalid Request",
        description: "Missing required subscription information. Please try again.",
        variant: "destructive"
      });
      return null;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tierId) || !uuidRegex.test(creatorId)) {
      log('Invalid UUID format', { tierId, creatorId });
      toast({
        title: "Invalid Request",
        description: "Invalid subscription parameters. Please try again.",
        variant: "destructive"
      });
      return null;
    }

    const lockKey = `${user.id}-${creatorId}-${tierId}`;
    
    // Check if this subscription is locked (already being processed)
    if (lockedSubscriptions.has(lockKey)) {
      log('Subscription already being processed', { lockKey });
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
      log('Using cached session', { cacheKey });
      
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
    
    try {
      const requestPayload = {
        action: 'create_subscription',
        tierId: tierId,
        creatorId: creatorId
      };

      log('Sending request to edge function', requestPayload);

      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: requestPayload
      });

      log('Edge function response received', { data, error });

      // Handle edge function errors
      if (error) {
        log('Edge function error', error);
        
        let errorMessage = 'Failed to create subscription. Please try again.';
        
        // Parse error response if it's a structured error
        if (error.message) {
          try {
            const parsedError = JSON.parse(error.message);
            errorMessage = parsedError.error || error.message;
          } catch {
            errorMessage = error.message;
          }
        }

        // Provide specific error messages based on error type
        if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (errorMessage.includes('configuration') || errorMessage.includes('environment')) {
          errorMessage = 'Payment system configuration error. Please contact support.';
        } else if (errorMessage.includes('Stripe')) {
          // Keep Stripe errors as they are usually user-friendly
        } else if (errorMessage.includes('database')) {
          errorMessage = 'Database error. Please try again or contact support.';
        }

        toast({
          title: "Subscription Failed",
          description: errorMessage,
          variant: "destructive"
        });

        return { error: errorMessage };
      }

      // Handle structured error responses from the function
      if (data?.error) {
        log('Function returned error', data);
        
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
        log('No data returned from function');
        toast({
          title: "Subscription Failed",
          description: "No response from subscription service. Please try again.",
          variant: "destructive"
        });
        return { error: 'No response from subscription service' };
      }

      // Check if we should use custom payment page
      if (data.useCustomPaymentPage && data.clientSecret) {
        log('Navigating to custom payment page');
        
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
        log('Subscription creation successful');
        
        toast({
          title: data.isUpgrade ? "Subscription Updated!" : "Subscription Created!",
          description: data.message || (data.isUpgrade ? "Your subscription tier has been updated." : "Your subscription is now active."),
        });

        return data;
      }

      // Fallback case
      log('Unexpected response format', data);
      return data;

    } catch (error) {
      log('Unexpected error', { 
        error: error.message, 
        stack: error.stack,
        name: error.name 
      });
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle network errors
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
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
    log('Cleared subscription cache', { cacheKey });
  }, [user]);

  return {
    createSubscription,
    isProcessing,
    setIsProcessing,
    clearSubscriptionCache
  };
};
