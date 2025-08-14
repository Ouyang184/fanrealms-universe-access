import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentMethod {
  id: string;
  type: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  is_default: boolean;
  created_at: string;
}

export const usePaymentMethods = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment methods using secure function
  const { data: paymentMethods = [], isLoading, refetch } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Use the secure function for enhanced security
      const { data, error } = await supabase.rpc('get_user_payment_methods_secure', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      return (data || []) as PaymentMethod[];
    },
  });

  // Create setup intent for adding new payment method
  const createSetupIntentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('payment-methods', {
        body: { action: 'create_setup_intent' }
      });

      if (error) throw error;
      return data.clientSecret;
    },
    onError: (error) => {
      console.error('Setup intent error:', error);
      toast({
        title: "Error",
        description: "Failed to prepare payment method setup",
        variant: "destructive"
      });
    }
  });

  // Set default payment method
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const { data, error } = await supabase.functions.invoke('payment-methods', {
        body: { action: 'set_default', paymentMethodId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast({
        title: "Success",
        description: "Default payment method updated",
      });
    },
    onError: (error) => {
      console.error('Set default error:', error);
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive"
      });
    }
  });

  // Delete payment method
  const deleteMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const { data, error } = await supabase.functions.invoke('payment-methods', {
        body: { action: 'delete', paymentMethodId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast({
        title: "Success",
        description: "Payment method removed",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive"
      });
    }
  });

  return {
    paymentMethods,
    isLoading,
    refetch,
    createSetupIntent: createSetupIntentMutation.mutateAsync,
    isCreatingSetupIntent: createSetupIntentMutation.isPending,
    setAsDefault: setDefaultMutation.mutateAsync,
    isSettingDefault: setDefaultMutation.isPending,
    deletePaymentMethod: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
};