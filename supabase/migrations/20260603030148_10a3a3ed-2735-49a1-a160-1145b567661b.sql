-- Restrict column-level SELECT on sensitive columns from anon/authenticated.
-- These tables have public SELECT policies; revoking column privileges prevents
-- clients from reading sensitive fields while leaving the rest of the row readable.

REVOKE SELECT (asset_file_path, stripe_price_id) ON public.digital_products FROM anon, authenticated;
REVOKE SELECT (platform_fee_rate) ON public.creators FROM anon, authenticated;
REVOKE SELECT (contact_info) ON public.job_listings FROM anon;

-- Re-grant SELECT on all other columns so PostgREST `select=*` requests don't
-- fail. We list each remaining column explicitly.

GRANT SELECT (
  id, creator_id, title, description, short_description, cover_image_url,
  asset_url, trailer_url, project_id, godot_version, license, version,
  screenshots, status, tags, category, price, sale_price, pricing_model,
  created_at, updated_at
) ON public.digital_products TO anon, authenticated;

GRANT SELECT (
  id, user_id, username, display_name, creator_name, bio, profile_image_url,
  banner_url, website, tags, follower_count, is_nsfw, accepts_commissions,
  commission_slots_available, commission_base_rate, commission_turnaround_days,
  commission_tos, user_profile_picture, created_at, updated_at
) ON public.creators TO anon, authenticated;