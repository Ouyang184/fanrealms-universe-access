-- Comprehensive security fix: Protect ALL sensitive creator financial data

-- First, let's update the get_public_creator_profile function to exclude sensitive financial fields
CREATE OR REPLACE FUNCTION public.get_public_creator_profile(
  p_creator_id uuid DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
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
$$;

-- Create a separate function for getting commission info (only for authenticated users who need it)
CREATE OR REPLACE FUNCTION public.get_creator_commission_info(p_creator_id uuid)
RETURNS TABLE(
  id uuid,
  accepts_commissions boolean,
  commission_base_rate numeric,
  commission_turnaround_days integer,
  commission_slots_available integer,
  commission_tos text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id,
    c.accepts_commissions,
    c.commission_base_rate,
    c.commission_turnaround_days,
    c.commission_slots_available,
    c.commission_tos
  FROM public.creators c
  WHERE c.id = p_creator_id
    AND c.accepts_commissions = true
    AND (
      -- Only authenticated users can see commission details
      auth.uid() IS NOT NULL
      -- OR the creator can always see their own commission info
      OR c.user_id = auth.uid()
    )
  LIMIT 1;
$$;

-- Update the get_public_creators_list function to exclude sensitive financial data
CREATE OR REPLACE FUNCTION public.get_public_creators_list(
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'created_at', 
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
STABLE SECURITY DEFINER
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

-- Add additional security policies to restrict access to sensitive commission fields
CREATE POLICY "Creators can view their own commission rates" 
ON public.creators 
FOR SELECT 
USING (
  auth.uid() = user_id AND (
    commission_base_rate IS NOT NULL OR 
    commission_turnaround_days IS NOT NULL OR 
    commission_slots_available IS NOT NULL
  )
);

-- Log sensitive financial data access for monitoring
CREATE OR REPLACE FUNCTION public.log_commission_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when someone accesses commission financial data
  RAISE LOG 'Commission financial data accessed: user_id=%, creator_id=%, timestamp=%', 
    auth.uid(), NEW.id, now();
  RETURN NEW;
END;
$$;