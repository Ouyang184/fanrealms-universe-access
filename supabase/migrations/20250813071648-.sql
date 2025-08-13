-- Harden RLS and security before publish

-- 1) Lock down email_2fa_codes to service-role only and tighten retention cleanup
ALTER TABLE public.email_2fa_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing user-accessible policies
DROP POLICY IF EXISTS "Users can delete their own 2FA codes" ON public.email_2fa_codes;
DROP POLICY IF EXISTS "Users can insert their own 2FA codes" ON public.email_2fa_codes;
DROP POLICY IF EXISTS "Users can update their own 2FA codes" ON public.email_2fa_codes;
DROP POLICY IF EXISTS "Users can view their own 2FA codes" ON public.email_2fa_codes;

-- Service role-only access for all operations on email_2fa_codes
CREATE POLICY "Service role manages 2FA codes"
ON public.email_2fa_codes
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Shorten 2FA code retention: aggressively clean up old/expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.email_2fa_codes 
  WHERE expires_at < now()
     OR created_at < now() - INTERVAL '15 minutes';
END;
$function$;

-- 2) Fix critical issue on users table: remove client-side INSERTs and use auth trigger
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove client-side insert capability (trigger will populate instead)
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;

-- Create trigger on auth.users to automatically populate public.users on signup
-- Use the existing lightweight function public.handle_new_user_simple()
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- (Optional hardening) Ensure only service role can ever insert directly into public.users
-- Without this policy, RLS denies by default; adding for explicitness
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

-- Note: Existing SELECT/UPDATE policies on public.users remain unchanged (self-access only)

-- 3) Reaffirm creator_earnings protections (no changes needed functionally)
-- Add explicit deny-everything-except-defined-policies stance via no-op since RLS already enabled
-- and only SELECT by creator + INSERT by service_role exist. No additional SQL required.

-- 4) Commission requests: policies already restrict to customer or owning creator via creators.user_id mapping
-- No column-level masking in Postgres RLS; keep as-is. Use secure function/view for specialized reads if needed.