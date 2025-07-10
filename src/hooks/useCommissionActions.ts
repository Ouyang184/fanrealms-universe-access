
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export const useCommissionActions = () => {
  const queryClient = useQueryClient();

  const handleCommissionAction = useMutation({
    mutationFn: async ({ commissionId, action }: { commissionId: string; action: 'accept' | 'reject' }) => {
      const { data, error } = await supabase.functions.invoke('handle-commission-action', {
        body: { commissionId, action }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commission-requests'] });
      
      const actionText = variables.action === 'accept' ? 'accepted' : 'rejected';
      
      let message = variables.action === 'accept' 
        ? 'Commission accepted and payment captured successfully!'
        : 'Commission rejected and payment refunded to customer.';
      
      // Add platform fee information for accepted commissions
      if (variables.action === 'accept' && data.platformFee && data.creatorNetAmount) {
        message += ` Platform fee: $${data.platformFee.toFixed(2)}. Your net amount: $${data.creatorNetAmount.toFixed(2)}.`;
      }
      
      toast({
        title: `Commission ${actionText}`,
        description: message,
      });
    },
    onError: (error) => {
      console.error('Error handling commission action:', error);
      toast({
        title: "Error",
        description: "Failed to process commission action. Please try again.",
        variant: "destructive"
      });
    },
  });

  const handleManualRefund = useMutation({
    mutationFn: async ({ commissionId, reason }: { commissionId: string; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke('manual-refund-commission', {
        body: { commissionId, reason }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-requests'] });
      toast({
        title: "Refund Processed",
        description: "Manual refund has been issued successfully.",
      });
    },
    onError: (error) => {
      console.error('Error processing refund:', error);
      toast({
        title: "Refund Error",
        description: "Failed to process refund. Please try again.",
        variant: "destructive"
      });
    },
  });

  return {
    acceptCommission: (commissionId: string) => 
      handleCommissionAction.mutate({ commissionId, action: 'accept' }),
    rejectCommission: (commissionId: string) => 
      handleCommissionAction.mutate({ commissionId, action: 'reject' }),
    processRefund: (commissionId: string, reason?: string) => 
      handleManualRefund.mutate({ commissionId, reason }),
    isProcessing: handleCommissionAction.isPending || handleManualRefund.isPending,
  };
};
