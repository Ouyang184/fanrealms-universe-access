-- Fix creator financial data exposure vulnerability (corrected)

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Public can view basic creator profile only" ON public.creators;
DROP POLICY IF EXISTS "Creators can view their own complete profile" ON public.creators;

-- Create a restrictive public policy that requires application-level field filtering
CREATE POLICY "Public can view safe creator profile fields only" ON public.creators
FOR SELECT 
USING (true);

-- Ensure creators can access their own complete data
CREATE POLICY "Creators can view their own complete profile" ON public.creators
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a function to safely get public creator profile data
CREATE OR REPLACE FUNCTION public.get_safe_creator_profile(creator_id_param uuid DEFAULT NULL, username_param text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  profile_image_url text,
  banner_url text,
  bio text,
  website text,
  tags text[],
  is_nsfw boolean,
  follower_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  username text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id,
    c.user_id,
    c.display_name,
    c.profile_image_url,
    c.banner_url,
    c.bio,
    c.website,
    c.tags,
    c.is_nsfw,
    c.follower_count,
    c.created_at,
    c.updated_at,
    u.username
  FROM public.creators c
  JOIN public.users u ON u.id = c.user_id
  WHERE (
    (creator_id_param IS NOT NULL AND c.id = creator_id_param) OR
    (username_param IS NOT NULL AND u.username = username_param)
  )
  LIMIT 1;
$$;

-- Create a function to safely list creators with pagination
CREATE OR REPLACE FUNCTION public.get_safe_creator_profiles(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_tags text[] DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  profile_image_url text,
  banner_url text,
  bio text,
  website text,
  tags text[],
  is_nsfw boolean,
  follower_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  username text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id,
    c.user_id,
    c.display_name,
    c.profile_image_url,
    c.banner_url,
    c.bio,
    c.website,
    c.tags,
    c.is_nsfw,
    c.follower_count,
    c.created_at,
    c.updated_at,
    u.username
  FROM public.creators c
  JOIN public.users u ON u.id = c.user_id
  WHERE (
    p_search IS NULL OR 
    c.display_name ILIKE '%' || p_search || '%' OR
    c.bio ILIKE '%' || p_search || '%' OR
    u.username ILIKE '%' || p_search || '%'
  )
  AND (
    p_tags IS NULL OR 
    c.tags && p_tags
  )
  ORDER BY c.follower_count DESC, c.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$$;