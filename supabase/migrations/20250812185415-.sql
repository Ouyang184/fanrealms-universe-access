-- Harden access to public.users: keep RLS, restrict anon grants, preserve authenticated access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Revoke all privileges from anon and public roles
DO $$ BEGIN
  REVOKE ALL ON TABLE public.users FROM anon;
  REVOKE ALL ON TABLE public.users FROM PUBLIC; -- built-in Postgres PUBLIC role
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'users table not found';
END $$;

-- Ensure authenticated role has minimal privileges; RLS enforces per-row access
DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE ON TABLE public.users TO authenticated;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'users table not found for grants';
END $$;
