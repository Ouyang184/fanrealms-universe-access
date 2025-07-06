
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { toast } from '@/hooks/use-toast';

export const useCommissionTypes = () => {
  const { creatorProfile } = useCreatorProfile();
  const queryClient = useQueryClient();

  const { data: commissionTypes = [], isLoading } = useQuery({
    queryKey: ['commission-types', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('commission_types')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!creatorProfile?.id,
  });

  const deleteCommissionTypeMutation = useMutation({
    mutationFn: async (typeId: string) => {
      const { error } = await supabase
        .from('commission_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-types'] });
      toast({
        title: "Success",
        description: "Commission type deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting commission type:', error);
      toast({
        title: "Error",
        description: "Failed to delete commission type. Please try again.",
        variant: "destructive"
      });
    },
  });

  const refetchCommissionTypes = () => {
    queryClient.invalidateQueries({ queryKey: ['commission-types'] });
  };

  return {
    commissionTypes,
    isLoading,
    deleteCommissionType: (id: string) => deleteCommissionTypeMutation.mutate(id),
    refetchCommissionTypes,
  };
};
