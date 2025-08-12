-- Strengthen RLS on public.users to explicitly prevent anon/public access to sensitive data
-- 1) Ensure RLS is enabled (safe no-op if already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2) Replace broad (PUBLIC) SELECT policies with authenticated-only self-access
DROP POLICY IF EXISTS "Users can view their own email" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

CREATE POLICY "Authenticated users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Note: We keep existing INSERT/UPDATE self policies unchanged to avoid impacting signup/update flows.
-- Public profile exposure should continue via existing SECURITY DEFINER RPCs (e.g., get_user_public_profiles) which return only non-sensitive fields.