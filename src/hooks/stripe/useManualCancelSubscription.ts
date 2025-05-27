
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useManualCancelSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const manualCancelSubscription = async (creatorId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to cancel subscriptions",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Manual cancellation for creator:', creatorId);
      
      const { data, error } = await supabase.functions.invoke('manual-cancel-subscription', {
        body: { creatorId }
      });

      if (error) {
        console.error('Manual cancel error:', error);
        throw error;
      }

      console.log('Manual cancel success:', data);
      
      toast({
        title: "Subscription Canceled",
        description: data.message || "Your subscription has been canceled successfully",
      });

      // Refresh the page to update UI
      window.location.reload();

    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    manualCancelSubscription,
    isLoading
  };
};
