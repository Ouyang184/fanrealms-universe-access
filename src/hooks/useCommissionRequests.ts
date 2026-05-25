
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
          commission_type:commission_types(name, base_price)
        `)
        .eq('creator_id', creatorProfile.id)
        .neq('status', 'rejected')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles via SECURITY DEFINER RPC (users RLS blocks direct join)
      const customerIds = [...new Set((data || []).map(r => r.customer_id).filter(Boolean))];
      const { data: profiles } = customerIds.length > 0
        ? await supabase.rpc('get_public_user_profiles', { _user_ids: customerIds })
        : { data: [] };
      const profileMap = new Map(((profiles as any[]) ?? []).map(p => [p.id, p]));

      // Transform the data and remove duplicates
      const transformedData = (data || []).map(request => {
        const profile = profileMap.get(request.customer_id);
        return {
          ...request,
          customer: profile ? { username: profile.username, profile_picture: profile.profile_picture } : { username: 'Unknown', profile_picture: null },
          status: request.status as CommissionRequestStatus,
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
