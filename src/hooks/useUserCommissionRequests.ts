
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
      
      // First check if the request exists and belongs to the user
      const { data: existingRequest, error: fetchError } = await supabase
        .from('commission_requests')
        .select('id, status, customer_id')
        .eq('id', requestId)
        .eq('customer_id', user?.id)
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
      const { error: deleteError } = await supabase
        .from('commission_requests')
        .delete()
        .eq('id', requestId)
        .eq('customer_id', user?.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      console.log('Successfully deleted request:', requestId);
    },
    onSuccess: (_, requestId) => {
      console.log('Delete mutation successful for:', requestId);
      queryClient.invalidateQueries({ queryKey: ['user-commission-requests'] });
      toast({
        title: "Success",
        description: "Commission request deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Error deleting commission request:', error);
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
