
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export const useCommissionActions = () => {
  const queryClient = useQueryClient();

  const acceptCommissionMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      console.log('Accepting commission request:', commissionId);
      
      const { data, error } = await supabase
        .from('commission_requests')
        .update({ 
          status: 'accepted',
          creator_notes: 'Commission accepted! Please proceed with payment to begin work.'
        })
        .eq('id', commissionId)
        .select()
        .single();

      if (error) {
        console.error('Error accepting commission:', error);
        throw new Error(error.message || 'Failed to accept commission');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-requests'] });
      toast({
        title: "Commission Accepted",
        description: "The customer will be notified to complete payment.",
      });
    },
    onError: (error) => {
      console.error('Error accepting commission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept commission. Please try again.",
        variant: "destructive"
      });
    },
  });

  const rejectCommissionMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      console.log('Rejecting commission request:', commissionId);
      
      const { data, error } = await supabase
        .from('commission_requests')
        .update({ 
          status: 'rejected',
          creator_notes: 'Commission request has been declined.'
        })
        .eq('id', commissionId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting commission:', error);
        throw new Error(error.message || 'Failed to reject commission');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-requests'] });
      toast({
        title: "Commission Rejected",
        description: "The commission request has been declined.",
      });
    },
    onError: (error) => {
      console.error('Error rejecting commission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject commission. Please try again.",
        variant: "destructive"
      });
    },
  });

  const createPaymentSessionMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      console.log('Creating payment session for commission:', commissionId);
      
      const { data, error } = await supabase.functions.invoke('create-commission-payment', {
        body: { commissionId }
      });

      if (error) {
        console.error('Payment session creation error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }
      
      if (!data?.url) {
        throw new Error('No payment URL received');
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Open payment session in new tab
      window.open(data.url, '_blank');
      toast({
        title: "Payment Session Created",
        description: "Please complete payment in the new tab.",
      });
    },
    onError: (error) => {
      console.error('Error creating payment session:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to create payment session. Please try again.",
        variant: "destructive"
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ commissionId, status }: { commissionId: string; status: string }) => {
      const { data, error } = await supabase
        .from('commission_requests')
        .update({ status })
        .eq('id', commissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-requests'] });
      toast({
        title: "Status Updated",
        description: "Commission status has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update commission status. Please try again.",
        variant: "destructive"
      });
    },
  });

  return {
    acceptCommission: (commissionId: string) => 
      acceptCommissionMutation.mutate(commissionId),
    rejectCommission: (commissionId: string) => 
      rejectCommissionMutation.mutate(commissionId),
    createPaymentSession: (commissionId: string) => 
      createPaymentSessionMutation.mutate(commissionId),
    updateStatus: (commissionId: string, status: string) => 
      updateStatusMutation.mutate({ commissionId, status }),
    isProcessing: acceptCommissionMutation.isPending || rejectCommissionMutation.isPending || 
                  createPaymentSessionMutation.isPending || updateStatusMutation.isPending,
  };
};
