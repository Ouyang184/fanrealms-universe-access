-- Update existing public creator functions to be secure

-- Replace get_public_creator_profile with secure version
DROP FUNCTION IF EXISTS public.get_public_creator_profile(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_public_creator_profile(uuid, text);
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
    p_creator_id IS NOT NULL AND c.id = p_creator_id
  ) OR (
    p_username IS NOT NULL AND u.username = p_username
  )
  LIMIT 1;
$$;

-- Replace get_public_creators_list with secure version 
DROP FUNCTION IF EXISTS public.get_public_creators_list;
CREATE OR REPLACE FUNCTION public.get_public_creators_list(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'created_at'
)
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
  username text,
  created_at timestamp with time zone
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
    u.username,
    c.created_at
  FROM public.creators c
  JOIN public.users u ON u.id = c.user_id
  WHERE (
    p_search IS NULL OR 
    c.display_name ILIKE '%' || p_search || '%' OR
    c.bio ILIKE '%' || p_search || '%' OR
    u.username ILIKE '%' || p_search || '%'
  )
  ORDER BY 
    CASE WHEN p_sort = 'followers' THEN c.follower_count END DESC,
    CASE WHEN p_sort = 'created_at' THEN c.created_at END DESC,
    c.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$$;

-- Update get_public_creators_by_user_ids to be secure
DROP FUNCTION IF EXISTS public.get_public_creators_by_user_ids;
CREATE OR REPLACE FUNCTION public.get_public_creators_by_user_ids(p_user_ids uuid[])
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  profile_image_url text,
  bio text
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
    c.bio
  FROM public.creators c
  WHERE c.user_id = ANY(p_user_ids);
$$;