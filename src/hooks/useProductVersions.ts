import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProductVersion {
  id: string;
  product_id: string;
  version_number: string;
  release_notes: string | null;
  created_at: string;
}

export function useProductVersions(productId: string) {
  return useQuery({
    queryKey: ['product-versions', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_versions')
        .select('id, product_id, version_number, release_notes, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProductVersion[];
    },
  });
}

export function usePublishProductVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: {
      productId: string;
      versionNumber: string;
      releaseNotes: string;
      file: File;
    }) => {
      if (!user) throw new Error('Not signed in');
      const { productId, versionNumber, releaseNotes, file } = args;

      // Look up creator id for the storage path (matches existing convention)
      const { data: creator, error: creatorErr } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (creatorErr || !creator) throw new Error('Creator profile not found');

      const safeVersion = versionNumber.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${creator.id}/${productId}/versions/${Date.now()}-${safeVersion}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-files')
        .upload(path, file, { upsert: false });
      if (uploadErr) throw new Error('File upload failed: ' + uploadErr.message);

      // Insert version row
      const { data: inserted, error: insertErr } = await supabase
        .from('product_versions')
        .insert({
          product_id: productId,
          version_number: versionNumber.trim(),
          release_notes: releaseNotes.trim() || null,
          file_path: path,
        })
        .select('id, product_id, version_number, release_notes, created_at')
        .single();
      if (insertErr) throw new Error('Failed to record version: ' + insertErr.message);

      // Point the live product at the new file & version
      const { error: updateErr } = await supabase
        .from('digital_products')
        .update({
          version: versionNumber.trim(),
          asset_file_path: path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
      if (updateErr) throw new Error('Failed to update product: ' + updateErr.message);

      return { ...(inserted as ProductVersion), file_path: path };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-versions', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['product', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['creator-product', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['creator-products'] });
      toast.success('New version published');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
