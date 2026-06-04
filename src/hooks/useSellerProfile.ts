import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSellerProfile(username: string) {
  return useQuery({
    queryKey: ['seller-profile', username],
    enabled: !!username,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select('id, user_id, username, display_name, bio, profile_image_url, banner_url, created_at, follower_count, website, accepts_commissions, commission_slots_available, commission_base_rate, commission_turnaround_days, commission_tos')
        .eq('username', username)
        .maybeSingle();
      if (error) throw error;
      return data; // null when creator doesn't exist
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
        .select('id, creator_id, title, description, short_description, cover_image_url, asset_url, trailer_url, project_id, godot_version, license, version, screenshots, status, tags, category, price, sale_price, created_at, updated_at, creators(id, username, display_name, profile_image_url)')
        .eq('creator_id', creatorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSellerProjects(creatorId: string) {
  return useQuery({
    queryKey: ['seller-projects', creatorId],
    enabled: !!creatorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, slug, short_description, cover_image_url, classification, genre, created_at')
        .eq('creator_id', creatorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSellerDevlogs(creatorUserId: string) {
  return useQuery({
    queryKey: ['seller-devlogs', creatorUserId],
    enabled: !!creatorUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devlogs')
        .select('id, title, content, created_at, projects:project_id(id, title, slug)')
        .eq('author_id', creatorUserId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}
