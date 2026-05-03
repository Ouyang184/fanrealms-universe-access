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
    EXISTS (SELECT 1 FROM public.projects p WHERE p.creator_id = c.id)
    OR EXISTS (SELECT 1 FROM public.digital_products d WHERE d.creator_id = c.id)
  )
  AND (
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