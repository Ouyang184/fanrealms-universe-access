import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

async function getCreatorId(userId: string) {
  const { data } = await supabase.from('creators').select('id').eq('user_id', userId).maybeSingle();
  return data?.id ?? null;
}

export function useCreatorSales() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['creator-sales', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const cid = await getCreatorId(user!.id);
      if (!cid) return [];
      const { data, error } = await (supabase as any)
        .from('sales')
        .select('*, sale_items(id, project_id)')
        .eq('creator_id', cid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSale() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; discount_percent: number; starts_at: string; ends_at: string; project_ids: string[] }) => {
      const cid = await getCreatorId(user!.id);
      if (!cid) throw new Error('Creator profile required');
      const { data: sale, error } = await (supabase as any).from('sales').insert({
        creator_id: cid,
        name: input.name,
        discount_percent: input.discount_percent,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
      }).select().single();
      if (error) throw error;
      if (input.project_ids.length > 0) {
        const items = input.project_ids.map((pid) => ({ sale_id: sale.id, project_id: pid }));
        const { error: itemsErr } = await (supabase as any).from('sale_items').insert(items);
        if (itemsErr) throw itemsErr;
      }
      return sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['creator-sales'] });
      toast.success('Sale created');
    },
    onError: (e: Error) => toast.error('Failed: ' + e.message),
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('sales').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-sales'] }),
  });
}

export function useCreatorBundles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['creator-bundles', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const cid = await getCreatorId(user!.id);
      if (!cid) return [];
      const { data, error } = await (supabase as any)
        .from('bundles')
        .select('*, bundle_items(id, project_id)')
        .eq('creator_id', cid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateBundle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string; bundle_price: number; cover_image_url?: string; project_ids: string[]; status?: 'draft' | 'published' }) => {
      const cid = await getCreatorId(user!.id);
      if (!cid) throw new Error('Creator profile required');
      const { data: bundle, error } = await (supabase as any).from('bundles').insert({
        creator_id: cid,
        title: input.title,
        description: input.description ?? null,
        bundle_price: input.bundle_price,
        cover_image_url: input.cover_image_url ?? null,
        status: input.status ?? 'draft',
      }).select().single();
      if (error) throw error;
      if (input.project_ids.length > 0) {
        const items = input.project_ids.map((pid) => ({ bundle_id: bundle.id, project_id: pid }));
        const { error: itemsErr } = await (supabase as any).from('bundle_items').insert(items);
        if (itemsErr) throw itemsErr;
      }
      return bundle;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['creator-bundles'] });
      toast.success('Bundle created');
    },
    onError: (e: Error) => toast.error('Failed: ' + e.message),
  });
}

export function useUpdateBundleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'published' }) => {
      const { error } = await (supabase as any).from('bundles').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-bundles'] }),
  });
}

export function useDeleteBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('bundles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-bundles'] }),
  });
}
