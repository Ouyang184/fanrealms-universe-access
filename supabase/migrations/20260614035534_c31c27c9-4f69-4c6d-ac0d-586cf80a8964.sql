
-- Revoke column-level SELECT on sensitive columns from anon/authenticated.
-- service_role keeps full access (edge functions unaffected).

REVOKE SELECT (platform_fee_rate) ON public.creators FROM anon, authenticated;

REVOKE SELECT (asset_file_path, asset_url, stripe_price_id) ON public.digital_products FROM anon, authenticated;

REVOKE SELECT (contact_info) ON public.job_listings FROM anon, authenticated;

REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM anon, authenticated;

REVOKE SELECT (file_path) ON public.product_versions FROM anon, authenticated;

-- Scope the product-images storage SELECT policy to owners only.
-- Public reads continue to work via the public-bucket CDN URL (bypasses RLS).
-- Owner-scoped SELECT preserves upsert pre-check for cover uploads.
DROP POLICY IF EXISTS "product-images public read" ON storage.objects;

CREATE POLICY "product-images owner read"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
