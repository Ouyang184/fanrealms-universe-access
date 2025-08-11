-- Update get_public_creator_profile to also accept user_id and add a list function for public creators

CREATE OR REPLACE FUNCTION public.get_public_creator_profile(
  p_creator_id uuid DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
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
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  WHERE (
    p_creator_id IS NOT NULL AND c.id = p_creator_id
  ) OR (
    p_username IS NOT NULL AND u.username = p_username
  ) OR (
    p_user_id IS NOT NULL AND c.user_id = p_user_id
  )
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_creator_profile(uuid, text, uuid) TO anon, authenticated;

-- List creators with basic filtering and sorting, excluding sensitive columns
CREATE OR REPLACE FUNCTION public.get_public_creators_list(
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'created_at', -- 'followers' | 'created_at'
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
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
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    CASE WHEN p_sort = 'followers' THEN NULL END, follower_count DESC,
    CASE WHEN p_sort <> 'followers' THEN created_at END DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_creators_list(text, text, integer, integer) TO anon, authenticated;

-- Tighten creators RLS: remove broad public select and add owner-only select
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'creators' AND policyname = 'Anyone can view creators'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can view creators" ON public.creators';
  END IF;
END $$;

-- Ensure SELECT allowed for owners
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'creators' AND policyname = 'Users can view their own creator profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own creator profile" ON public.creators FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
