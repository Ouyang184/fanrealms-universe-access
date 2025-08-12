-- Remove legacy/unused public.commission relation safely to eliminate exposure surface
DO $$
DECLARE relkind CHAR;
BEGIN
  SELECT c.relkind INTO relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'commission';

  IF relkind IS NULL THEN
    RAISE NOTICE 'public.commission not found, nothing to drop';
  ELSIF relkind = 'v' THEN
    EXECUTE 'DROP VIEW IF EXISTS public.commission CASCADE';
    RAISE NOTICE 'Dropped VIEW public.commission';
  ELSIF relkind = 'r' THEN
    EXECUTE 'DROP TABLE IF EXISTS public.commission CASCADE';
    RAISE NOTICE 'Dropped TABLE public.commission';
  ELSE
    RAISE NOTICE 'public.commission exists but is not a table/view (relkind=%), skipping', relkind;
  END IF;
END $$;