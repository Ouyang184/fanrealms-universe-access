import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSellerProfile(username: string) {
  return useQuery({
    queryKey: ['seller-profile', username],
    enabled: !!username,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select('id, username, display_name, bio, profile_image_url, banner_url, created_at, follower_count')
        .eq('username', username)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSellerProducts(creatorId: string) {
  return useQuery({
    queryKey: ['seller-products', creatorId],
    enabled: !!creatorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select('*, creators(id, username, display_name, profile_image_url)')
        .eq('creator_id', creatorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
