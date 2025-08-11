-- Remove view to address linter warning about security definer exposure via view
DROP VIEW IF EXISTS public.user_public_profiles;

-- Keep the SECURITY DEFINER function and its grants for RPC usage only
-- (No further changes needed here)