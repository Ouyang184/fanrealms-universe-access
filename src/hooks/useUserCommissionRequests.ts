
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CommissionRequestStatus } from '@/types/commission';

interface UserCommissionRequestWithRelations {
  id: string;
  commission_type_id: string;
  customer_id: string;
  creator_id: string;
  title: string;
  description: string;
  reference_images: string[];
  budget_range_min?: number;
  budget_range_max?: number;
  agreed_price?: number;
  status: CommissionRequestStatus;
  deadline?: string;
  customer_notes?: string;
  creator_notes?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  commission_type: {
    name: string;
    base_price: number;
    description: string;
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
          commission_type:commission_types(name, base_price, description),
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
      const { error } = await supabase
        .from('commission_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-commission-requests'] });
      toast({
        title: "Success",
        description: "Commission request deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Error deleting commission request:', error);
      toast({
        title: "Error",
        description: "Failed to delete commission request",
        variant: "destructive"
      });
    },
  });

  const deleteRequest = (id: string) => {
    deleteRequestMutation.mutate(id);
  };

  return {
    requests,
    isLoading,
    deleteRequest,
    isDeleting: deleteRequestMutation.isPending,
  };
};
