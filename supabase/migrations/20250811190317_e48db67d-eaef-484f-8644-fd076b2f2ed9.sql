-- Phase 1: Create SECURITY DEFINER RPCs exposing only public-safe fields

-- 1) Public-safe creator profile fetcher
CREATE OR REPLACE FUNCTION public.get_public_creator_profile(
  p_creator_id uuid DEFAULT NULL,
  p_username text DEFAULT NULL
)
RETURNS TABLE (
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
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    p_creator_id IS NOT NULL AND c.id = p_creator_id
  ) OR (
    p_username IS NOT NULL AND u.username = p_username
  )
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_creator_profile(uuid, text) TO anon, authenticated;

-- 2) Public-safe membership tiers fetcher (excludes Stripe IDs)
CREATE OR REPLACE FUNCTION public.get_public_membership_tiers(
  p_creator_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  creator_id uuid,
  title text,
  description text,
  price numeric,
  active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    mt.id,
    mt.creator_id,
    mt.title,
    mt.description,
    mt.price,
    mt.active
  FROM public.membership_tiers mt
  WHERE mt.creator_id = p_creator_id AND mt.active = true
  ORDER BY mt.price ASC, mt.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_membership_tiers(uuid, integer, integer) TO anon, authenticated;

-- 3) Public-safe commission types fetcher (excludes internal pricing rules / revision fees)
CREATE OR REPLACE FUNCTION public.get_public_commission_types(
  p_creator_id uuid,
  p_only_active boolean DEFAULT true,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  creator_id uuid,
  name text,
  description text,
  base_price numeric,
  estimated_turnaround_days integer,
  is_active boolean,
  sample_art_url text,
  tags text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    ct.id,
    ct.creator_id,
    ct.name,
    ct.description,
    ct.base_price,
    ct.estimated_turnaround_days,
    ct.is_active,
    ct.sample_art_url,
    ct.tags
  FROM public.commission_types ct
  WHERE ct.creator_id = p_creator_id
    AND (p_only_active IS FALSE OR ct.is_active = true)
  ORDER BY ct.base_price ASC, ct.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_commission_types(uuid, boolean, integer, integer) TO anon, authenticated;
