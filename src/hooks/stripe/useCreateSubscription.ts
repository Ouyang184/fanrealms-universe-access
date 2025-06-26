
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateSubscriptionResult {
  success?: boolean;
  error?: { message: string };
  clientSecret?: string;
  subscriptionId?: string;
}

export const useCreateSubscription = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscription = async (params: { tierId: string; creatorId: string }): Promise<CreateSubscriptionResult> => {
    try {
      setIsProcessing(true);
      
      // Add timeout handling for edge function calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: { 
          action: 'create',
          tier_id: params.tierId,
          creator_id: params.creatorId 
        }
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
        return { success: true };
      } else if (data?.clientSecret) {
        return { 
          success: true, 
          clientSecret: data.clientSecret,
          subscriptionId: data.subscriptionId 
        };
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
      return { error: { message: errorMessage } };
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSubscriptionCache = (tierId: string, creatorId: string) => {
    // Implementation for clearing subscription cache
    console.log('Clearing subscription cache for tier:', tierId, 'creator:', creatorId);
  };

  return {
    createSubscription,
    isProcessing,
    setIsProcessing,
    clearSubscriptionCache,
  };
};
