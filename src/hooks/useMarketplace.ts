import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useMarketplaceProducts(category?: string) {
  return useQuery({
    queryKey: ['marketplace-products', category],
    queryFn: async () => {
      let query = supabase
        .from('digital_products')
        .select('*, creators(id, username, display_name, profile_image_url)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatorProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['creator-products', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!creator) return [];

      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select('*, creators(id, username, display_name, profile_image_url)')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (product: {
      title: string;
      description?: string;
      price: number;
      category?: string;
      tags?: string[];
      cover_image_url?: string;
      asset_url?: string;
      status?: string;
    }) => {
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!creator) throw new Error('Creator profile not found');

      const { data, error } = await supabase
        .from('digital_products')
        .insert({
          ...product,
          creator_id: creator.id,
          status: product.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    },
  });
}

export function useUserPurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-purchases', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, digital_products(title, cover_image_url), creators(username, display_name)')
        .eq('buyer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
