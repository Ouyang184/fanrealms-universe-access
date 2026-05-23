-- Drop old signature, recreate with display_name included so forum can
-- prefer display_name over username for official/branded accounts.
DROP FUNCTION IF EXISTS public.get_public_user_profiles(uuid[]);

CREATE OR REPLACE FUNCTION public.get_public_user_profiles(_user_ids uuid[])
RETURNS TABLE(id uuid, username text, display_name text, profile_picture text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.id, u.username, u.display_name, u.profile_picture
  FROM public.users u
  WHERE u.id = ANY(_user_ids);
$$;
