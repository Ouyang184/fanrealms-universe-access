
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCreatorCommissions(creatorId: string) {
  const { data: commissionData, isLoading } = useQuery({
    queryKey: ['creator-commissions', creatorId],
    queryFn: async () => {
      if (!creatorId) return null;

      // Fetch creator info
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('accepts_commissions, commission_info, commission_tos')
        .eq('id', creatorId)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
        return null;
      }

      // Fetch commission types
      const { data: commissionTypes, error: typesError } = await supabase
        .from('commission_types')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('created_at');

      if (typesError) {
        console.error('Error fetching commission types:', typesError);
      }

      // Fetch available slots count
      const { count: availableSlots, error: slotsError } = await supabase
        .from('commission_slots')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('is_available', true)
        .gt('available_slots', 0);

      if (slotsError) {
        console.error('Error fetching slots:', slotsError);
      }

      // Fetch portfolio items
      const { data: portfolioItems, error: portfolioError } = await supabase
        .from('commission_portfolios')
        .select(`
          *,
          commission_type:commission_types(name)
        `)
        .eq('creator_id', creatorId)
        .order('display_order', { ascending: true });

      if (portfolioError) {
        console.error('Error fetching portfolio:', portfolioError);
      }

      return {
        creator,
        commissionTypes: commissionTypes || [],
        availableSlots: availableSlots || 0,
        portfolioItems: portfolioItems || []
      };
    },
    enabled: !!creatorId
  });

  return {
    creator: commissionData?.creator,
    commissionTypes: commissionData?.commissionTypes,
    availableSlots: commissionData?.availableSlots || 0,
    portfolioItems: commissionData?.portfolioItems,
    isLoading
  };
}
