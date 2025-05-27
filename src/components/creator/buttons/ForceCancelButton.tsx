
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function ForceCancelButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleForceCancel = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to cancel subscriptions.",
        variant: "destructive"
      });
      return;
    }

    setIsCancelling(true);
    
    try {
      console.log('Force cancelling all subscriptions...');
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'cancel_subscription',
          subscriptionId: 'force_cancel_all' // Special identifier to cancel all
        }
      });

      if (error) {
        console.error('Error force cancelling subscriptions:', error);
        throw error;
      }

      console.log('Force cancel result:', data);
      
      // Refresh all subscription-related data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userActiveSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['enhancedUserSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
        queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      ]);

      toast({
        title: "Subscriptions Cancelled",
        description: "All active subscriptions have been cancelled and removed.",
      });
      
      // Force a page refresh to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to force cancel subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscriptions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Button 
      onClick={handleForceCancel}
      disabled={isCancelling}
      variant="destructive"
      className="gap-2"
    >
      {isCancelling ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Cancelling All...
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4" />
          Force Cancel All Subscriptions
        </>
      )}
    </Button>
  );
}
