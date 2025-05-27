
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCreateSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
        // Don't throw here, return the error so the component can handle it
        return { error: data.error };
      }

      if (!data) {
        console.error('useCreateSubscription: No data returned from function');
        throw new Error('No response from subscription service');
      }

      console.log('useCreateSubscription: Subscription creation successful');
      return data;

    } catch (error) {
      console.error('useCreateSubscription: Failed to create subscription:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription';
      
      // Don't show toast here - let the component handle it for better UX
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing]);

  return {
    createSubscription,
    isProcessing,
    setIsProcessing
  };
};
