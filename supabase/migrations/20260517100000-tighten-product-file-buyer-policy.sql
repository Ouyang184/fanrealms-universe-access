-- Tighten the product-files buyer SELECT policy:
-- Cross-verify that the product's creator_id matches the first path segment,
-- so no crafted path can ever satisfy both the creator and buyer conditions.
--
-- Previous policy only checked purchases.product_id vs path segment 2.
-- This adds a JOIN to digital_products to ensure:
--   path[1] = product's creator_id  (creator owns the path prefix)
--   path[2] = product's id          (product is in that creator's folder)
-- Without this, a buyer of product X from Creator A could theoretically
-- satisfy the policy with a path like creator_b_id/product_x_id/file
-- (even though Creator B's INSERT policy prevents such paths from existing).

DROP POLICY IF EXISTS "Creators and buyers can read product files" ON storage.objects;

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
    -- Buyer has a completed purchase AND the product belongs to the creator
    -- whose ID is in the first path segment (double-locks path ownership).
    EXISTS (
      SELECT 1
      FROM public.purchases pu
      JOIN public.digital_products dp ON dp.id = pu.product_id
      WHERE pu.buyer_id   = auth.uid()
        AND pu.product_id = (string_to_array(name, '/'))[2]::uuid
        AND pu.status     = 'completed'
        AND dp.creator_id::text = (string_to_array(name, '/'))[1]
    )
  )
);
