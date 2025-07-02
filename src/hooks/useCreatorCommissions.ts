
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCreatorCommissions(creatorId: string) {
  const { data: commissionData, isLoading } = useQuery({
    queryKey: ['creator-commissions', creatorId],
    queryFn: async () => {
      if (!creatorId) return null;

      // Fetch creator info with fallback for commission fields
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
        return null;
      }

      // Try to fetch commission types, handle gracefully if table doesn't exist
      let commissionTypes = [];
      try {
        const { data: types, error: typesError } = await supabase
          .from('commission_types' as any)
          .select('*')
          .eq('creator_id', creatorId)
          .eq('is_active', true)
          .order('created_at');

        if (!typesError && types) {
          commissionTypes = types;
        }
      } catch (error) {
        console.log('Commission types table not yet available:', error);
      }

      // Try to fetch available slots count, handle gracefully if table doesn't exist  
      let availableSlots = 0;
      try {
        const { count, error: slotsError } = await supabase
          .from('commission_slots' as any)
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorId)
          .eq('is_available', true)
          .gt('available_slots', 0);

        if (!slotsError && count !== null) {
          availableSlots = count;
        }
      } catch (error) {
        console.log('Commission slots table not yet available:', error);
      }

      // Try to fetch portfolio items, handle gracefully if table doesn't exist
      let portfolioItems = [];
      try {
        const { data: portfolio, error: portfolioError } = await supabase
          .from('commission_portfolios' as any)
          .select(`
            *,
            commission_type:commission_types(name)
          `)
          .eq('creator_id', creatorId)
          .order('display_order', { ascending: true });

        if (!portfolioError && portfolio) {
          portfolioItems = portfolio;
        }
      } catch (error) {
        console.log('Commission portfolios table not yet available:', error);
      }

      return {
        creator,
        commissionTypes,
        availableSlots,
        portfolioItems
      };
    },
    enabled: !!creatorId
  });

  return {
    creator: commissionData?.creator,
    commissionTypes: commissionData?.commissionTypes || [],
    availableSlots: commissionData?.availableSlots || 0,
    portfolioItems: commissionData?.portfolioItems || [],
    isLoading
  };
}
