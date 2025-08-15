-- Drop specific function signatures to avoid conflicts
DROP FUNCTION IF EXISTS public.get_public_creator_profile(p_creator_id uuid, p_user_id uuid, p_username text);
DROP FUNCTION IF EXISTS public.get_public_creator_profile(p_creator_id uuid, p_username text);
DROP FUNCTION IF EXISTS public.get_public_creator_profile(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_public_creator_profile(uuid, text);

-- Now create the secure version
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