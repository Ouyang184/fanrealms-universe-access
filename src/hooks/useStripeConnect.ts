
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useStripeConnect = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // Get current Stripe connection status
  const { data: stripeStatus, isLoading, refetch } = useQuery({
    queryKey: ['stripe-connect', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('creators')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('user_id', user.id as any)
        .single();

      if (error) {
        console.error('Error fetching Stripe status:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id
  });

  const createStripeAccount = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to connect your Stripe account.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'create-account' }
      });

      if (error) throw error;

      const { accountLink } = data;
      
      if (accountLink?.url) {
        // Redirect to Stripe onboarding
        window.location.href = accountLink.url;
      } else {
        throw new Error('No account link returned from Stripe');
      }
    } catch (error: any) {
      console.error('Error creating Stripe account:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to Stripe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const refreshStripeStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'refresh-status' }
      });

      if (error) throw error;

      // Refetch the status
      await refetch();
      
      toast({
        title: "Status updated",
        description: "Your Stripe connection status has been refreshed.",
      });
    } catch (error: any) {
      console.error('Error refreshing Stripe status:', error);
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to refresh status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isConnected = !!(stripeStatus as any)?.stripe_account_id;
  const hasStripeAccount = isConnected;
  const stripeAccountId = (stripeStatus as any)?.stripe_account_id;
  
  // Check if onboarding is complete and payments are enabled
  const isOnboardingComplete = !!(stripeStatus as any)?.stripe_account_id && 
                              !!(stripeStatus as any)?.stripe_charges_enabled;

  const isStripeReady = isConnected && 
                       (stripeStatus as any)?.stripe_account_id && 
                       (stripeStatus as any)?.stripe_charges_enabled;

  return {
    stripeStatus: stripeStatus as any,
    isConnected,
    hasStripeAccount,
    stripeAccountId,
    isOnboardingComplete,
    isStripeReady,
    isLoading,
    isConnecting,
    createStripeAccount,
    refreshStripeStatus,
    refetch
  };
};
