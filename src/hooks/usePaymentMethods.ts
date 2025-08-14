import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
  display_text?: string; // New secure display field
}

export const usePaymentMethods = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment methods using secure display
  const { data: paymentMethods = [], isLoading, refetch } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      console.log('Fetching payment methods with enhanced security...');
      
      const { data, error } = await supabase.functions.invoke('payment-methods', {
        method: 'GET'
      });

      if (error) {
        console.error('Payment methods fetch error:', error);
        throw error;
      }
      
      console.log('Received secure payment data:', data);
      return data.paymentMethods as PaymentMethod[];
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