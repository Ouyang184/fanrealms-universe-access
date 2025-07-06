
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CommissionRequest, CommissionRequestStatus } from '@/types/commission';

interface UserCommissionRequestWithRelations extends Omit<CommissionRequest, 'status'> {
  status: string;
  commission_type: {
    name: string;
    base_price: number;
  };
  creator: {
    display_name: string;
    profile_image_url?: string;
  };
}

export const useUserCommissionRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['user-commission-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          commission_type:commission_types(name, base_price),
          creator:creators(display_name, profile_image_url)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(request => ({
        ...request,
        status: request.status as CommissionRequestStatus
      }));
    },
    enabled: !!user?.id,
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.log('Attempting to delete commission request:', requestId);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Direct delete for pending/rejected requests (no payment involved)
      const { error } = await supabase
        .from('commission_requests')
        .delete()
        .eq('id', requestId)
        .eq('customer_id', user.id);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message || 'Failed to delete commission request');
      }

      console.log('Successfully deleted request:', requestId);
      return requestId;
    },
    onMutate: async (requestId) => {
      // Optimistic update - remove from UI immediately
      console.log('Optimistically removing request from UI:', requestId);
      
      await queryClient.cancelQueries({ queryKey: ['user-commission-requests'] });
      
      const previousData = queryClient.getQueryData(['user-commission-requests', user?.id]);
      
      queryClient.setQueryData(['user-commission-requests', user?.id], (old: any) => {
        if (!old) return old;
        return old.filter((request: any) => request.id !== requestId);
      });
      
      return { previousData };
    },
    onSuccess: (requestId) => {
      console.log('Delete mutation successful for:', requestId);
      queryClient.refetchQueries({ queryKey: ['user-commission-requests'] });
      toast({
        title: "Success",
        description: "Commission request deleted successfully."
      });
    },
    onError: (error, requestId, context) => {
      console.error('Error deleting commission request:', error);
      
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['user-commission-requests', user?.id], context.previousData);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete commission request';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });

  const deleteRequest = (requestId: string) => {
    console.log('deleteRequest called with ID:', requestId);
    if (!requestId) {
      console.error('No request ID provided');
      toast({
        title: "Error",
        description: "Invalid request ID",
        variant: "destructive"
      });
      return;
    }
    deleteRequestMutation.mutate(requestId);
  };

  return {
    requests,
    isLoading,
    deleteRequest,
    isDeleting: deleteRequestMutation.isPending,
  };
};
