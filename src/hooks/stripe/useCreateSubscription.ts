
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCreateSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscription = useCallback(async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    if (!user || isProcessing) return null;

    setIsProcessing(true);
    try {
      console.log('Creating subscription for tier:', tierId, 'creator:', creatorId);
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'create_subscription',
          tierId: tierId,
          creatorId: creatorId
        }
      });

      if (error) {
        console.error('Error creating subscription:', error);
        throw new Error(error.message || 'Failed to create subscription');
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('Subscription created successfully:', data);
      return data;

    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, toast]);

  return {
    createSubscription,
    isProcessing,
    setIsProcessing
  };
};
