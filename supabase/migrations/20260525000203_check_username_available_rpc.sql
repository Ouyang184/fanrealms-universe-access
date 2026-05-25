-- SECURITY DEFINER function that checks whether a username is available,
-- bypassing the users table RLS policy that prevents reading other users' rows.
-- Returns TRUE if the username is free (case-insensitive), FALSE if taken.
-- The calling user's own row is excluded so they can "keep" their current name.

CREATE OR REPLACE FUNCTION public.check_username_available(
  p_username text,
  p_user_id  uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE lower(username) = lower(p_username)
      AND (p_user_id IS NULL OR id <> p_user_id)
  );
$$;

-- Grant execute to authenticated and anonymous callers
GRANT EXECUTE ON FUNCTION public.check_username_available(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(text, uuid) TO anon;
