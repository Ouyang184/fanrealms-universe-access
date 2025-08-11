-- Replace get_user_following with expanded return type
DROP FUNCTION IF EXISTS public.get_user_following(uuid, int, int);

CREATE FUNCTION public.get_user_following(
  p_user_id uuid,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  creator_id uuid,
  creator_user_id uuid,
  display_name text,
  username text,
  profile_image_url text,
  banner_url text,
  bio text,
  follower_count integer,
  is_nsfw boolean,
  tags text[],
  followed_at timestamptz
) AS $$
  SELECT 
    c.id AS creator_id,
    c.user_id AS creator_user_id,
    c.display_name,
    u.username,
    c.profile_image_url,
    c.banner_url,
    c.bio,
    c.follower_count,
    c.is_nsfw,
    c.tags,
    f.created_at AS followed_at
  FROM public.follows f
  JOIN public.creators c ON c.id = f.creator_id
  JOIN public.users u ON u.id = c.user_id
  WHERE f.user_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_following(uuid, int, int) TO anon, authenticated;