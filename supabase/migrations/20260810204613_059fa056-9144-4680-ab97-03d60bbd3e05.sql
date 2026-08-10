
DROP FUNCTION IF EXISTS public.get_creator_product(uuid);

CREATE OR REPLACE FUNCTION public.get_creator_product(p_product_id uuid)
RETURNS TABLE(
  id uuid, creator_id uuid, title text, description text, short_description text,
  price numeric, sale_price numeric, pricing_model text, category text, tags text[],
  cover_image_url text, banner_image_url text, accent_color text, asset_url text,
  asset_file_path text, trailer_url text, screenshots text[], version text, license text,
  godot_version text, engine text, project_id uuid, status text, stripe_price_id text,
  scan_status text, scan_verdict jsonb, scanned_at timestamptz,
  created_at timestamptz, updated_at timestamptz
)
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
    p.godot_version, p.engine, p.project_id, p.status, p.stripe_price_id,
    p.scan_status, p.scan_verdict, p.scanned_at,
    p.created_at, p.updated_at
  FROM public.digital_products p
  JOIN public.creators c ON c.id = p.creator_id
  WHERE p.id = p_product_id
    AND c.user_id = auth.uid();
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_creator_product(uuid) TO authenticated;
