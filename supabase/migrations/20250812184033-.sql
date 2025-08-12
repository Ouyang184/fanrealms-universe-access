-- Lock down public.commission (it is a VIEW, so RLS doesn't apply)
-- Revoke access from anon/authenticated; allow only service_role for server-side use

DO $$ BEGIN
  -- Revoke all privileges from anon/authenticated
  REVOKE ALL ON TABLE public.commission FROM anon;
  REVOKE ALL ON TABLE public.commission FROM authenticated;
EXCEPTION WHEN undefined_table THEN
  -- View doesn't exist; skip silently
  RAISE NOTICE 'View public.commission not found, skipping grants revocation';
END $$;

-- Grant minimal read to service_role only (Edge functions)
DO $$ BEGIN
  GRANT SELECT ON TABLE public.commission TO service_role;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'View public.commission not found, skipping grant';
END $$;
