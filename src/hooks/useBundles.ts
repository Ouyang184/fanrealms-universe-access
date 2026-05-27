import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';

export function usePublicBundle(bundleId: string | undefined) {
  return useQuery({
    queryKey: ['public-bundle', bundleId],
    enabled: !!bundleId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bundles')
        .select(`
          id, title, description, bundle_price, cover_image_url, status, creator_id, created_at,
          creators(id, username, display_name, profile_image_url),
          bundle_items(
            id,
            project_id,
            projects(id, title, slug, cover_image_url, short_description)
          )
        `)
        .eq('id', bundleId!)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useBundlesByCreator(creatorId: string | undefined) {
  return useQuery({
    queryKey: ['bundles-by-creator', creatorId],
    enabled: !!creatorId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bundles')
        .select('id, title, bundle_price, cover_image_url, bundle_items(id)')
        .eq('creator_id', creatorId!)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserOwnsBundle(bundleId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owns-bundle', bundleId, user?.id],
    enabled: !!bundleId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bundle_purchases')
        .select('id')
        .eq('bundle_id', bundleId!)
        .eq('buyer_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useBundleCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  async function checkout(bundleId: string) {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to purchase');

      const { data, error } = await supabase.functions.invoke('create-bundle-checkout', {
        body: { bundleId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw new Error(error.message ?? 'Failed to start checkout');
      if (!data?.url) throw new Error('No checkout URL returned');

      const url = new URL(data.url);
      if (url.protocol !== 'https:' || !url.hostname.endsWith('stripe.com')) {
        throw new Error('Invalid checkout URL');
      }
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
      setIsLoading(false);
    }
  }

  return { checkout, isLoading };
}
