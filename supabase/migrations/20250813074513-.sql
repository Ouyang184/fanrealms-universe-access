-- Harden RLS enforcement on users table and add a safe public RPC for whitelisted profile fields

-- Ensure RLS is enabled and enforced (idempotent)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Create a SECURITY DEFINER function to expose only public-safe user fields
-- This aligns with the "PUBLIC_USER_DATA" requirement without weakening RLS
CREATE OR REPLACE FUNCTION public.get_user_public_data(
  ids uuid[] DEFAULT NULL,
  usernames text[] DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  username text,
  profile_picture text,
  website text,
  created_at timestamptz
) AS $$
  SELECT u.id, u.username, u.profile_picture, u.website, u.created_at
  FROM public.users u
  WHERE (ids IS NULL OR u.id = ANY(ids))
    AND (usernames IS NULL OR u.username = ANY(usernames));
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public';

-- Optional: keep both function names for compatibility if other parts expect the existing RPC
-- (We already have get_user_public_profiles in this project; this function provides a clearer alias for scanners/tools.)