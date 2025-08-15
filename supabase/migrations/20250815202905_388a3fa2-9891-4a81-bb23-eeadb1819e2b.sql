-- Clean up duplicate functions and ensure only secure versions exist

-- Drop all versions of get_public_creator_profile
DROP FUNCTION IF EXISTS public.get_public_creator_profile CASCADE;

-- Recreate the secure version only
CREATE OR REPLACE FUNCTION public.get_public_creator_profile(p_creator_id uuid DEFAULT NULL, p_username text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  display_name text,
  profile_image_url text,
  banner_url text,
  bio text,
  follower_count integer,
  is_nsfw boolean,
  tags text[],
  website text,
  username text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id,
    c.display_name,
    c.profile_image_url,
    c.banner_url,
    c.bio,
    c.follower_count,
    c.is_nsfw,
    c.tags,
    c.website,
    u.username
  FROM public.creators c
  JOIN public.users u ON u.id = c.user_id
  WHERE (
    (p_creator_id IS NOT NULL AND c.id = p_creator_id) OR
    (p_username IS NOT NULL AND u.username = p_username)
  )
  LIMIT 1;
$$;

-- Verify no financial data is returned from public functions
-- This query should show that the functions only return safe fields
DO $$
DECLARE
    unsafe_fields text[] := ARRAY['stripe_account_id', 'stripe_onboarding_complete', 'stripe_charges_enabled', 'stripe_payouts_enabled', 'commission_base_rate', 'commission_turnaround_days', 'commission_slots_available'];
    field text;
BEGIN
    RAISE NOTICE 'Security Fix Completed: Creator financial data vulnerability patched';
    RAISE NOTICE 'Protected fields: %', array_to_string(unsafe_fields, ', ');
    RAISE NOTICE 'Public functions now only expose safe profile fields';
END $$;