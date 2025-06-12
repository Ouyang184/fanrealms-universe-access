
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useCreateSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscription = useCallback(async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    if (!user || isProcessing) {
      console.log('Cannot create subscription: user not authenticated or already processing');
      return null;
    }

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
        return { 
          error: data.error,
          shouldRefresh: data.shouldRefresh || false
        };
      }

      if (!data) {
        console.error('useCreateSubscription: No data returned from function');
        throw new Error('No response from subscription service');
      }

      // Check if we should use custom payment page
      if (data.useCustomPaymentPage && data.clientSecret) {
        console.log('useCreateSubscription: Navigating to custom payment page');
        navigate('/payment', {
          state: {
            clientSecret: data.clientSecret,
            amount: data.amount,
            tierName: data.tierName,
            tierId: data.tierId,
            creatorId: data.creatorId
          }
        });
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
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, navigate]);

  return {
    createSubscription,
    isProcessing,
    setIsProcessing
  };
};
