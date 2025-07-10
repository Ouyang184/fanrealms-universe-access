
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CommissionRequest, CommissionRequestStatus } from '@/types/commission';

interface UserCommissionRequestWithRelations extends Omit<CommissionRequest, 'status' | 'selected_addons'> {
  status: string;
  selected_addons: any; // Database Json type
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
      
      // First check if the request exists and belongs to the user
      const { data: existingRequest, error: fetchError } = await supabase
        .from('commission_requests')
        .select('id, status, customer_id')
        .eq('id', requestId)
        .eq('customer_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching request:', fetchError);
        throw new Error('Request not found or access denied');
      }

      if (!existingRequest) {
        throw new Error('Request not found');
      }

      console.log('Found request to delete:', existingRequest);

      // Check if the request can be deleted (only pending or rejected requests)
      if (!['pending', 'rejected'].includes(existingRequest.status)) {
        throw new Error('Only pending or rejected requests can be deleted');
      }

      // Delete the request
      const { error: deleteError, count } = await supabase
        .from('commission_requests')
        .delete()
        .eq('id', requestId)
        .eq('customer_id', user.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        // Check if it's an RLS policy violation
        if (deleteError.message?.includes('row-level security policy')) {
          throw new Error('You do not have permission to delete this request');
        }
        throw deleteError;
      }

      console.log('Successfully deleted request:', requestId, 'Affected rows:', count);
      
      // Verify the deletion actually happened
      if (count === 0) {
        throw new Error('Request could not be deleted - it may no longer exist or you lack permission');
      }
      
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
      // Force refetch to ensure consistency
      queryClient.refetchQueries({ queryKey: ['user-commission-requests'] });
      toast({
        title: "Success",
        description: "Commission request deleted successfully"
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
