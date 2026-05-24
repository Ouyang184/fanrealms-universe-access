CREATE TABLE public.product_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  version_number text NOT NULL,
  release_notes text,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_versions_product_created
  ON public.product_versions (product_id, created_at DESC);

ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper to check creator ownership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_product_owner(_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM digital_products dp
    JOIN creators c ON c.id = dp.creator_id
    WHERE dp.id = _product_id
      AND c.user_id = auth.uid()
  );
$$;

-- Public can view changelog entries for published products; owners always can
CREATE POLICY "Public can view versions of published products"
ON public.product_versions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM digital_products dp
    WHERE dp.id = product_versions.product_id
      AND dp.status = 'published'
  )
  OR public.is_product_owner(product_id)
);

-- Only the product owner can write
CREATE POLICY "Owners can insert versions"
ON public.product_versions
FOR INSERT
TO authenticated
WITH CHECK (public.is_product_owner(product_id));

CREATE POLICY "Owners can update versions"
ON public.product_versions
FOR UPDATE
TO authenticated
USING (public.is_product_owner(product_id))
WITH CHECK (public.is_product_owner(product_id));

CREATE POLICY "Owners can delete versions"
ON public.product_versions
FOR DELETE
TO authenticated
USING (public.is_product_owner(product_id));