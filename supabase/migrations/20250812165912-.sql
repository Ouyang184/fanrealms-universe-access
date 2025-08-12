-- Fix RPC: get_public_creators_list ambiguous created_at reference causing empty results
CREATE OR REPLACE FUNCTION public.get_public_creators_list(
  p_search text DEFAULT NULL::text,
  p_sort text DEFAULT 'created_at'::text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT 
      c.id,
      c.user_id,
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
    WHERE p_search IS NULL
       OR c.display_name ILIKE '%' || p_search || '%'
       OR c.bio ILIKE '%' || p_search || '%'
       OR u.username ILIKE '%' || p_search || '%'
  )
  SELECT *
  FROM base
  ORDER BY 
    CASE WHEN p_sort = 'followers' THEN NULL END,
    base.follower_count DESC,
    CASE WHEN p_sort <> 'followers' THEN base.created_at END DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
END;
$$;