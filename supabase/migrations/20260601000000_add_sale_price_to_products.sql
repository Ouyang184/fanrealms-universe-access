-- Add sale_price column to digital_products
-- Creators can set a discounted price that shows as crossed-out original + sale price
-- sale_price = null means no active sale
-- sale_price must be lower than price (enforced in UI)
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS sale_price numeric DEFAULT NULL;

-- This table uses column-level grants (stripe_price_id is revoked), so new
-- columns are NOT readable by default. Explicitly grant SELECT so the public
-- marketplace queries that include sale_price don't fail with permission denied.
GRANT SELECT (sale_price) ON public.digital_products TO anon, authenticated;
