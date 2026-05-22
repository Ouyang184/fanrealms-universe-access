-- membership_tiers: revoke table-wide SELECT then grant only safe columns
REVOKE SELECT ON public.membership_tiers FROM anon, authenticated;
GRANT SELECT (id, creator_id, title, description, price, active, created_at, updated_at)
  ON public.membership_tiers TO anon, authenticated;

-- digital_products: revoke table-wide SELECT then grant only safe columns (omit stripe_price_id)
REVOKE SELECT ON public.digital_products FROM anon, authenticated;
GRANT SELECT (
  id, creator_id, title, description, short_description, cover_image_url,
  asset_url, asset_file_path, trailer_url, project_id, godot_version,
  license, version, screenshots, status, tags, category, price,
  created_at, updated_at
) ON public.digital_products TO anon, authenticated;