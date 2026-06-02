-- Fix 1: pricing_model was never granted SELECT to anon/authenticated, but it's
-- part of the marketplace/product queries. With column-level grants active on
-- this table, that omission made those queries fail with "permission denied"
-- (masked while the table was empty). Grant it — pricing_model is non-sensitive.
GRANT SELECT (pricing_model) ON public.digital_products TO anon, authenticated;

-- Fix 2: get_creator_product (used by the asset edit form) didn't return
-- sale_price or pricing_model, so editing an asset with an active sale would
-- load an empty sale field and silently wipe the sale on save. Add both.
DROP FUNCTION IF EXISTS public.get_creator_product(uuid);

CREATE OR REPLACE FUNCTION public.get_creator_product(p_product_id uuid)
 RETURNS TABLE(id uuid, creator_id uuid, title text, description text, short_description text, price numeric, sale_price numeric, pricing_model text, category text, tags text[], cover_image_url text, asset_url text, asset_file_path text, trailer_url text, screenshots text[], version text, license text, godot_version text, project_id uuid, status text, stripe_price_id text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.creator_id, p.title, p.description,
    p.short_description, p.price, p.sale_price, p.pricing_model, p.category, p.tags,
    p.cover_image_url, p.asset_url, p.asset_file_path,
    p.trailer_url, p.screenshots, p.version, p.license,
    p.godot_version, p.project_id, p.status, p.stripe_price_id,
    p.created_at, p.updated_at
  FROM public.digital_products p
  JOIN public.creators c ON c.id = p.creator_id
  WHERE p.id = p_product_id
    AND c.user_id = auth.uid();
END;
$function$;
