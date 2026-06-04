import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Safe column list for digital_products — excludes stripe_price_id which is
// revoked from anon/authenticated. Using this prevents PostgREST `select=*`
// from failing with "permission denied".
const DIGITAL_PRODUCT_COLUMNS =
  'id, creator_id, title, description, short_description, cover_image_url, asset_url, trailer_url, project_id, godot_version, license, version, screenshots, status, tags, category, price, sale_price, pricing_model, created_at, updated_at';

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['product-search', query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const term = query.trim();
      const { data, error } = await supabase
        .from('digital_products')
        .select('id, title, short_description, cover_image_url, price, category, creators(id, username, display_name)')
        .eq('status', 'published')
        .or(`title.ilike.%${term}%,short_description.ilike.%${term}%,tags.cs.{"${term}"}`)
        .order('created_at', { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarketplaceProducts(category?: string) {
  return useQuery({
    queryKey: ['marketplace-products', category],
    queryFn: async () => {
      let query = supabase
        .from('digital_products')
        .select(`${DIGITAL_PRODUCT_COLUMNS}, creators(id, username, display_name, profile_image_url)`)
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
        .maybeSingle();

      if (!creator) return [];

      const { data, error } = await supabase
        .from('digital_products')
        .select(DIGITAL_PRODUCT_COLUMNS)
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
        .select(`${DIGITAL_PRODUCT_COLUMNS}, creators(id, username, display_name, profile_image_url)`)
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Creator-only product fetch — calls get_creator_product() SECURITY DEFINER RPC
 * which returns the full row including asset_url and asset_file_path (columns
 * that are revoked from the anon/authenticated roles on the base table).
 * Returns null when the caller is not the product owner.
 */
export function useCreatorProduct(productId: string) {
  return useQuery({
    queryKey: ['creator-product', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_creator_product', { p_product_id: productId });
      if (error) throw error;
      // rpc returns an array; we want a single row
      return (data as any[])?.[0] ?? null;
    },
  });
}

export function useHasPurchased(productId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['has-purchased', productId, user?.id],
    enabled: !!productId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', user!.id)
        .eq('status', 'completed')
        .maybeSingle();
      if (error) throw error;
      return !!data;
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
      short_description?: string;
      price: number;
      sale_price?: number | null;
      category?: string;
      tags?: string[];
      cover_image_url?: string;
      asset_url?: string;
      trailer_url?: string;
      asset_file_path?: string;
      screenshots?: string[];
      version?: string;
      license?: string;
      godot_version?: string;
      status?: string;
      project_id?: string | null;
    }) => {
      let { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!creator) {
        // Auto-provision a creators row if one doesn't exist.
        // Fetch username from users table first — creators.username is non-nullable.
        const { data: userRow } = await supabase
          .from('users')
          .select('username')
          .eq('id', user!.id)
          .maybeSingle();
        if (!userRow?.username) throw new Error('Please complete your profile (username) before creating a project.');

        const { data: newCreator, error: createError } = await supabase
          .from('creators')
          .insert({ user_id: user!.id, username: userRow.username })
          .select('id')
          .single();
        if (createError || !newCreator) throw new Error('Could not set up your creator profile. Please try again.');
        creator = newCreator;
      }

      const { data, error } = await supabase
        .from('digital_products')
        .insert({
          ...product,
          creator_id: creator.id,
          status: product.status || 'draft',
        })
        .select(DIGITAL_PRODUCT_COLUMNS)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      // If this was the user's first product, a creator profile was just
      // auto-provisioned. Invalidate so Dashboard/Upload appear in the nav
      // immediately without requiring a page refresh.
      queryClient.invalidateQueries({ queryKey: ['creator-profile', user?.id] });
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
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      id: string;
      title?: string;
      description?: string;
      short_description?: string;
      price?: number;
      sale_price?: number | null;
      category?: string;
      tags?: string[];
      cover_image_url?: string;
      asset_url?: string;
      trailer_url?: string;
      asset_file_path?: string | null;
      screenshots?: string[];
      version?: string;
      license?: string;
      godot_version?: string;
      status?: string;
      project_id?: string | null;
    }) => {
      const { id, ...updates } = product;
      const { data, error } = await supabase
        .from('digital_products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(DIGITAL_PRODUCT_COLUMNS)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creator-products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', (data as any).id] });
      queryClient.invalidateQueries({ queryKey: ['creator-product', (data as any).id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
}

export function useSellerSales() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['seller-sales', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!creator) return { sales: [], totals: { gross: 0, fees: 0, net: 0 } };

      const { data, error } = await supabase
        .from('purchases')
        .select('*, digital_products(title, cover_image_url, project_id, projects:project_id(id, title))')
        .eq('creator_id', creator.id)
        .in('status', ['completed', 'refunded'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sales = data ?? [];
      const completed = sales.filter((p: any) => p.status === 'completed');
      const gross = completed.reduce((sum, p: any) => sum + (p.amount ?? 0), 0);
      const fees = completed.reduce((sum, p: any) => sum + (p.platform_fee ?? 0), 0);
      const net = completed.reduce((sum, p: any) => sum + (p.net_amount ?? 0), 0);

      return { sales, totals: { gross, fees, net } };
    },
  });
}

export function useRefundPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ purchaseId, reason }: { purchaseId: string; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke('refund-purchase', {
        body: { purchaseId, reason },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Refund issued');
      queryClient.invalidateQueries({ queryKey: ['seller-sales'] });
      queryClient.invalidateQueries({ queryKey: ['user-purchases'] });
    },
    onError: (e: Error) => toast.error('Refund failed: ' + e.message),
  });
}
