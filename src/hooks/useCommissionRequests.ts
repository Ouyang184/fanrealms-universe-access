
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
      
      console.log('🔍 Fetching commission requests for creator:', creatorProfile.id);
      
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

      if (error) {
        console.error('❌ Commission requests query error:', error);
        throw error;
      }
      
      console.log('📋 Raw commission requests data:', data);
      
      // Transform the data and remove duplicates
      const transformedData = (data || []).map(request => {
        console.log('🔄 Processing request:', request.id, 'Customer data:', request.customer);
        return {
          ...request,
          status: request.status as CommissionRequestStatus,
          // Ensure customer data is properly structured with better fallback
          customer: request.customer || { username: 'Unknown user', profile_picture: null }
        };
      });
      
      // Remove duplicates based on ID
      const uniqueRequests = transformedData.filter((request, index, self) => 
        index === self.findIndex(r => r.id === request.id)
      );
      
      return uniqueRequests;
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
    updateRequestMutation.mutate({
      id,
      updates: { status: 'accepted' }
    });
  };

  const rejectRequest = (id: string) => {
    updateRequestMutation.mutate({
      id,
      updates: { status: 'rejected' }
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
