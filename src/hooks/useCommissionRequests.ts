
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
      if (!creatorProfile?.id) return [];
      
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

      if (error) throw error;
      
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
      const { error } = await supabase
        .from('commission_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-requests'] });
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
    updateRequestMutation.mutate({
      id,
      updates: { 
        status: 'accepted',
        creator_notes: 'Commission accepted! Please proceed with payment to begin work.'
      }
    });
  };

  const rejectRequest = (id: string) => {
    updateRequestMutation.mutate({
      id,
      updates: { 
        status: 'rejected',
        creator_notes: 'Commission request has been declined.'
      }
    });
  };

  const updateRequestStatus = (id: string, status: CommissionRequestStatus) => {
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
