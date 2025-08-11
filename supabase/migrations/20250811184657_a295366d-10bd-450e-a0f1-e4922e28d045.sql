-- Fix migration: recreate policies without IF NOT EXISTS

-- Ensure RLS enabled
DO $$ BEGIN
  ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.creator_ratings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

-- Drop overly broad public SELECT policies
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.creator_ratings;

-- Recreate restricted SELECT policies
DROP POLICY IF EXISTS "Users can view their own follows" ON public.follows;
CREATE POLICY "Users can view their own follows"
ON public.follows
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own ratings" ON public.creator_ratings;
CREATE POLICY "Users can view their own ratings"
ON public.creator_ratings
FOR SELECT
USING (user_id = auth.uid());

-- RPCs (idempotent via OR REPLACE)
CREATE OR REPLACE FUNCTION public.get_user_following(
  p_user_id uuid,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  creator_id uuid,
  display_name text,
  username text,
  profile_image_url text,
  banner_url text,
  bio text,
  follower_count integer,
  is_nsfw boolean
) AS $$
  SELECT 
    c.id AS creator_id,
    c.display_name,
    u.username,
    c.profile_image_url,
    c.banner_url,
    c.bio,
    c.follower_count,
    c.is_nsfw
  FROM public.follows f
  JOIN public.creators c ON c.id = f.creator_id
  JOIN public.users u ON u.id = c.user_id
  WHERE f.user_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_user_following(uuid, int, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_creator_followers(
  p_creator_id uuid,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  username text,
  profile_picture text
) AS $$
  SELECT 
    u.id AS user_id,
    u.username,
    u.profile_picture
  FROM public.follows f
  JOIN public.users u ON u.id = f.user_id
  WHERE f.creator_id = p_creator_id
  ORDER BY f.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_creator_followers(uuid, int, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_creator_ratings(
  p_creator_id uuid,
  p_rating_type text DEFAULT 'general',
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  creator_id uuid,
  rating integer,
  review_text text,
  rating_type text,
  created_at timestamptz,
  username text,
  profile_picture text
) AS $$
  SELECT 
    r.id,
    r.user_id,
    r.creator_id,
    r.rating,
    r.review_text,
    r.rating_type,
    date_trunc('minute', r.created_at) AS created_at,
    u.username,
    u.profile_picture
  FROM public.creator_ratings r
  JOIN public.users u ON u.id = r.user_id
  WHERE r.creator_id = p_creator_id
    AND (p_rating_type IS NULL OR r.rating_type = p_rating_type)
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_creator_ratings(uuid, text, int, int) TO anon, authenticated;
