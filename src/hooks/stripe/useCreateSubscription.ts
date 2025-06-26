
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCreateSubscription = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscription = async (tierId: string, creatorId: string) => {
    try {
      setIsProcessing(true);
      
      // Add timeout handling for edge function calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: { 
          action: 'create',
          tier_id: tierId,
          creator_id: creatorId 
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Subscription creation error:', error);
        
        // Handle specific timeout errors
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        
        throw new Error(error.message || 'Failed to create subscription');
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error: any) {
      console.error('Create subscription error:', error);
      
      let errorMessage = 'Failed to create subscription. Please try again.';
      
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorMessage = 'The request timed out due to high server load. Please try again in a few moments.';
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createSubscription,
    isProcessing,
    setIsProcessing,
  };
};
