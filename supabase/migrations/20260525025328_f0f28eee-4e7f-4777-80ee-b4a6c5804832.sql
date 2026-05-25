-- Prevent users from self-promoting to admin via direct UPDATE on public.users.
-- Authenticated role can still update their own row (name, avatar, etc.) but not the is_admin column.
REVOKE UPDATE (is_admin) ON public.users FROM authenticated;
REVOKE UPDATE (is_admin) ON public.users FROM anon;

-- Add a RESTRICTIVE policy as defense-in-depth: even if column grants drift,
-- non-service-role updates cannot change is_admin.
DROP POLICY IF EXISTS "Prevent non-service-role from changing is_admin" ON public.users;
CREATE POLICY "Prevent non-service-role from changing is_admin"
ON public.users
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  is_admin IS NOT DISTINCT FROM (SELECT u.is_admin FROM public.users u WHERE u.id = users.id)
);