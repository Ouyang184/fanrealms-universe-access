
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { toast } from '@/hooks/use-toast';
import { CommissionType, CommissionAddon } from '@/types/commission';

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
      
      // Transform the data to properly type custom_addons
      const transformedData: CommissionType[] = (data || []).map(item => ({
        ...item,
        custom_addons: (() => {
          try {
            // Handle various possible formats of custom_addons
            if (!item.custom_addons) return [];
            if (Array.isArray(item.custom_addons)) return item.custom_addons as unknown as CommissionAddon[];
            if (typeof item.custom_addons === 'string') {
              const parsed = JSON.parse(item.custom_addons);
              return Array.isArray(parsed) ? parsed : [];
            }
            if (typeof item.custom_addons === 'object') {
              return Array.isArray(item.custom_addons) ? item.custom_addons as unknown as CommissionAddon[] : [];
            }
            return [];
          } catch (error) {
            console.warn('Failed to parse custom_addons:', error);
            return [];
          }
        })()
      }));
      
      return transformedData;
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
