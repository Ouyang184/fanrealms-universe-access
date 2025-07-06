
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useStripeConnect = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Get creator's Stripe Connect status
  const { data: connectStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['stripeConnectStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Create Stripe Connect account
  const { mutate: createConnectAccount } = useMutation({
    mutationFn: async (creatorId: string) => {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'create_account', creatorId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Open Stripe onboarding in a new tab to avoid CSP issues
      window.open(data.onboardingUrl, '_blank');
    },
    onError: (error) => {
      console.error('Error creating Stripe account:', error);
      toast({
        title: "Error",
        description: "Failed to create Stripe account. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create login link to Stripe Dashboard
  const createLoginLink = async (accountId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'create_login_link', accountId }
      });

      if (error) throw error;
      
      // Open Stripe dashboard in new tab
      window.open(data.loginUrl, '_blank');
    } catch (error) {
      console.error('Error creating login link:', error);
      toast({
        title: "Error",
        description: "Failed to access Stripe dashboard. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get account balance
  const { data: balance, refetch: refetchBalance } = useQuery({
    queryKey: ['stripeBalance', connectStatus?.stripe_account_id],
    queryFn: async () => {
      if (!connectStatus?.stripe_account_id) return null;
      
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'get_balance', accountId: connectStatus.stripe_account_id }
      });

      if (error) throw error;
      return data.balance;
    },
    enabled: !!connectStatus?.stripe_account_id && connectStatus.stripe_charges_enabled
  });

  return {
    connectStatus,
    statusLoading,
    createConnectAccount,
    createLoginLink,
    balance,
    refetchBalance,
    isLoading
  };
};
