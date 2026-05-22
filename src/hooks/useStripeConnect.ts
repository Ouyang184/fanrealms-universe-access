
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

  // Get creator's Stripe Connect status (boolean flags only, never the raw account id)
  const { data: connectStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['stripeConnectStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase as any)
        .from('creator_stripe_status')
        .select('is_connected, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as {
        is_connected: boolean | null;
        stripe_onboarding_complete: boolean | null;
        stripe_charges_enabled: boolean | null;
        stripe_payouts_enabled: boolean | null;
      } | null;
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
      window.location.href = data.onboardingUrl;
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

  // Create login link to Stripe Dashboard — server resolves the account id
  const createLoginLink = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'create_login_link' }
      });

      if (error) throw error;

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

  // Get account balance — server resolves the account id
  const { data: balance, refetch: refetchBalance } = useQuery({
    queryKey: ['stripeBalance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'get_balance' }
      });

      if (error) throw error;
      return data.balance;
    },
    enabled: !!connectStatus?.is_connected && !!connectStatus?.stripe_charges_enabled
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
