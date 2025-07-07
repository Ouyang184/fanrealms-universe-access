
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { toast } from '@/hooks/use-toast';
import { CommissionRequest, CommissionRequestStatus } from '@/types/commission';

interface CommissionRequestWithRelations extends Omit<CommissionRequest, 'status'> {
  status: string; // This will be the raw status from the database
  commission_type: {
    name: string;
    base_price: number;
  };
  customer: {
    username: string;
    profile_picture?: string;
  };
}

export const useCommissionRequests = () => {
  const { creatorProfile } = useCreatorProfile();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['commission-requests', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) {
        console.log('[useCommissionRequests] No creator profile ID, returning empty array');
        return [];
      }
      
      console.log('[useCommissionRequests] Fetching commission requests for creator:', creatorProfile.id);
      console.log('[useCommissionRequests] Query details:', {
        creator_id: creatorProfile.id,
        filters: 'status != rejected',
        order: 'created_at DESC'
      });
      
      const { data, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          commission_type:commission_types(name, base_price),
          customer:users(username, profile_picture)
        `)
        .eq('creator_id', creatorProfile.id)
        .neq('status', 'rejected') // Filter out rejected requests
        .order('created_at', { ascending: false });

      console.log('[useCommissionRequests] Query result:', {
        data: data,
        error: error,
        count: data?.length || 0,
        rawQuery: `SELECT * FROM commission_requests WHERE creator_id = '${creatorProfile.id}' AND status != 'rejected' ORDER BY created_at DESC`
      });

      if (error) {
        console.error('[useCommissionRequests] Error fetching commission requests:', error);
        throw error;
      }
      
      console.log(`[useCommissionRequests] Successfully fetched ${data?.length || 0} commission requests for creator ${creatorProfile.id}`);
      
      // Log each request for debugging
      if (data && data.length > 0) {
        data.forEach((request, index) => {
          console.log(`[useCommissionRequests] Request ${index + 1}:`, {
            id: request.id,
            title: request.title,
            status: request.status,
            customer_id: request.customer_id,
            creator_id: request.creator_id,
            created_at: request.created_at
          });
        });
      }
      
      // Transform the data to properly type the status field
      return (data || []).map(request => ({
        ...request,
        status: request.status as CommissionRequestStatus
      }));
    },
    enabled: !!creatorProfile?.id,
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('[useCommissionRequests] Updating commission request:', {
        id,
        updates
      });
      
      const { error } = await supabase
        .from('commission_requests')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('[useCommissionRequests] Error updating commission request:', error);
        throw error;
      }
      
      console.log('[useCommissionRequests] Successfully updated commission request:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-requests'] });
      toast({
        title: "Success",
        description: "Commission request updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating commission request:', error);
      toast({
        title: "Error",
        description: "Failed to update commission request",
        variant: "destructive"
      });
    },
  });

  const acceptRequest = (id: string) => {
    console.log('[useCommissionRequests] Accepting request:', id);
    updateRequestMutation.mutate({
      id,
      updates: { status: 'accepted' }
    });
  };

  const rejectRequest = (id: string) => {
    console.log('[useCommissionRequests] Rejecting request:', id);
    updateRequestMutation.mutate({
      id,
      updates: { status: 'rejected' }
    });
  };

  const updateRequestStatus = (id: string, status: CommissionRequestStatus) => {
    console.log('[useCommissionRequests] Updating request status:', {
      id,
      status
    });
    updateRequestMutation.mutate({
      id,
      updates: { status }
    });
  };

  return {
    requests,
    isLoading,
    acceptRequest,
    rejectRequest,
    updateRequestStatus,
    isUpdating: updateRequestMutation.isPending,
  };
};
