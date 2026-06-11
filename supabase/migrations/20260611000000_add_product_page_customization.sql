-- Lightweight product-page branding: a wide banner image and an accent color,
-- so creators can make their asset page feel like their own (itch.io-style),
-- without the risk of full custom CSS.
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS banner_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT NULL;

-- Public display fields; grant SELECT so they render on the public product page
-- (this table uses column-level grants).
GRANT SELECT (banner_image_url) ON public.digital_products TO anon, authenticated;
GRANT SELECT (accent_color) ON public.digital_products TO anon, authenticated;

-- Return the new fields from the creator edit RPC so the form can load them.
DROP FUNCTION IF EXISTS public.get_creator_product(uuid);

CREATE OR REPLACE FUNCTION public.get_creator_product(p_product_id uuid)
 RETURNS TABLE(id uuid, creator_id uuid, title text, description text, short_description text, price numeric, sale_price numeric, pricing_model text, category text, tags text[], cover_image_url text, banner_image_url text, accent_color text, asset_url text, asset_file_path text, trailer_url text, screenshots text[], version text, license text, godot_version text, project_id uuid, status text, stripe_price_id text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.creator_id, p.title, p.description,
    p.short_description, p.price, p.sale_price, p.pricing_model, p.category, p.tags,
    p.cover_image_url, p.banner_image_url, p.accent_color, p.asset_url, p.asset_file_path,
    p.trailer_url, p.screenshots, p.version, p.license,
    p.godot_version, p.project_id, p.status, p.stripe_price_id,
    p.created_at, p.updated_at
  FROM public.digital_products p
  JOIN public.creators c ON c.id = p.creator_id
  WHERE p.id = p_product_id
    AND c.user_id = auth.uid();
END;
$function$;
