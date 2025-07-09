
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockedSubscriptions, setLockedSubscriptions] = useState(new Set<string>());

  const createSubscription = useCallback(async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    console.log('[useCreateSubscription] Starting subscription creation with params:', {
      tierId,
      creatorId,
      userId: user?.id,
      userEmail: user?.email,
      isProcessing,
      timestamp: new Date().toISOString()
    });

    if (!user || isProcessing) {
      console.log('[useCreateSubscription] Cannot create subscription: user not authenticated or already processing', {
        hasUser: !!user,
        isProcessing
      });
      return null;
    }

    const lockKey = `${user.id}-${creatorId}-${tierId}`;
    console.log('[useCreateSubscription] Generated lock key:', lockKey);
    
    // Check if this subscription is locked (already being processed)
    if (lockedSubscriptions.has(lockKey)) {
      console.log('[useCreateSubscription] Subscription already being processed for:', lockKey);
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
    console.log('[useCreateSubscription] Checking cache for:', cacheKey, 'found:', !!cachedSession);
    
    if (cachedSession && (Date.now() - cachedSession.timestamp) < SESSION_CACHE_DURATION) {
      console.log('[useCreateSubscription] Using cached session for:', cacheKey, cachedSession);
      
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
    console.log('[useCreateSubscription] Locked subscription and set processing state');
    
    console.log('[useCreateSubscription] About to call stripe-subscriptions edge function with body:', {
      action: 'create_subscription',
      tierId: tierId,
      creatorId: creatorId
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'create_subscription',
          tierId: tierId,
          creatorId: creatorId
        }
      });

      console.log('[useCreateSubscription] Edge function response received:', { 
        data, 
        error,
        hasData: !!data,
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : null
      });

      if (error) {
        console.error('[useCreateSubscription] Edge function error:', error);
        toast({
          title: "Network Error",
          description: `Failed to connect to subscription service: ${error.message}`,
          variant: "destructive"
        });
        throw new Error(error.message || 'Failed to invoke subscription function');
      }

      if (data?.error) {
        console.error('[useCreateSubscription] Function returned error:', data.error);
        
        // Handle duplicate subscription errors gracefully
        if (data.shouldRefresh) {
          // Refresh subscription data
          queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] });
          queryClient.invalidateQueries({ queryKey: ['simple-user-subscriptions'] });
          queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
          
          toast({
            title: "Already Subscribed",
            description: data.error,
            variant: "default"
          });
        } else {
          toast({
            title: "Subscription Error", 
            description: data.error,
            variant: "destructive"
          });
        }
        
        return { 
          error: data.error,
          shouldRefresh: data.shouldRefresh || false
        };
      }

      if (!data) {
        console.error('[useCreateSubscription] No data returned from function');
        toast({
          title: "Service Error",
          description: "No response from subscription service",
          variant: "destructive"
        });
        throw new Error('No response from subscription service');
      }

      console.log('[useCreateSubscription] Function returned valid data:', data);

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

      // Fallback to checkout URL (shouldn't happen with new flow)
      if (data.checkout_url) {
        console.log('useCreateSubscription: Redirecting to Stripe Checkout');
        window.location.href = data.checkout_url;
        return data;
      }

      console.log('useCreateSubscription: Subscription creation successful');
      return data;

    } catch (error) {
      console.error('useCreateSubscription: Failed to create subscription:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
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
  }, [user, isProcessing, navigate, toast, lockedSubscriptions, queryClient]);

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
