-- Migration: Enforce column-level security on creators and job_listings.
-- Prior migrations fixed digital_products.asset_file_path correctly (no change needed here).

-- ============================================================
-- 1. Creators: restrict SELECT to safe columns only
-- ============================================================

-- Remove the broad table-level SELECT that exposes platform_fee_rate.
REVOKE SELECT ON public.creators FROM anon, authenticated;

-- Re-grant SELECT only on safe profile columns (platform_fee_rate excluded).
GRANT SELECT (
  id, user_id, username, display_name, creator_name, bio, profile_image_url,
  banner_url, website, tags, follower_count, is_nsfw, accepts_commissions,
  commission_slots_available, commission_base_rate, commission_turnaround_days,
  commission_tos, user_profile_picture, created_at, updated_at
) ON public.creators TO anon, authenticated;

-- ============================================================
-- 2. Job listings: restrict SELECT to safe columns only
-- ============================================================

-- Remove the broad table-level SELECT that exposes contact_info.
REVOKE SELECT ON public.job_listings FROM anon, authenticated;

-- Re-grant SELECT only on safe listing columns (contact_info excluded).
GRANT SELECT (
  id, title, description, requirements, category, budget_min, budget_max,
  budget_type, tags, deadline, status, poster_id, created_at, updated_at
) ON public.job_listings TO anon, authenticated;

-- ============================================================
-- 3. SECURITY DEFINER RPC: get_creator_fee_rate
-- ============================================================
-- Creators can no longer SELECT platform_fee_rate directly through
-- PostgREST (column is revoked). This function lets a creator read
-- their own fee rate by bypassing RLS / column restrictions.

CREATE OR REPLACE FUNCTION public.get_creator_fee_rate()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(platform_fee_rate, 5)
  FROM public.creators
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Ensure the authenticated role can call the new RPC.
GRANT EXECUTE ON FUNCTION public.get_creator_fee_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_fee_rate() TO anon;
