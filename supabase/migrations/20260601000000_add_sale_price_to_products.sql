-- Add sale_price column to digital_products
-- Creators can set a discounted price that shows as crossed-out original + sale price
-- sale_price = null means no active sale
-- sale_price must be lower than price (enforced in UI)
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS sale_price numeric DEFAULT NULL;
