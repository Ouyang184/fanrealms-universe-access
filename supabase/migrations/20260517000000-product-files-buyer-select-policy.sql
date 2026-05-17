-- Add SELECT policy on product-files storage bucket for creators and buyers.
--
-- Architecture note: the get-download-url Edge Function uses the service role key
-- which bypasses RLS and generates signed URLs (1-hour TTL). This SELECT policy is
-- therefore defense-in-depth only — it covers direct authenticated Storage API access,
-- not the Edge Function path.
--
-- Path format: {creator_id}/{product_id}/{filename}

CREATE POLICY "Creators and buyers can read product files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'product-files'
  AND (
    -- Creator owns the file (first path segment = their creator_id)
    (string_to_array(name, '/'))[1] IN (
      SELECT id::text FROM public.creators WHERE user_id = auth.uid()
    )
    OR
    -- Buyer has a completed purchase for this product (second path segment = product_id)
    EXISTS (
      SELECT 1 FROM public.purchases
      WHERE buyer_id  = auth.uid()
        AND product_id = (string_to_array(name, '/'))[2]::uuid
        AND status     = 'completed'
    )
  )
);
