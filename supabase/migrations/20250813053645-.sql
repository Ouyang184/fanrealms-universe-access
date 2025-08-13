-- Harden RLS on creator_earnings: restrict INSERTs to service_role only
DO $$
BEGIN
  -- Drop existing overly-permissive INSERT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'creator_earnings' 
      AND policyname = 'Service role can insert earnings'
      AND cmd = 'INSERT'
  ) THEN
    EXECUTE 'DROP POLICY "Service role can insert earnings" ON public.creator_earnings';
  END IF;
END $$;

-- Recreate strict INSERT policy limited to service_role
CREATE POLICY "Service role can insert earnings"
ON public.creator_earnings
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

-- Ensure no public UPDATE/DELETE policies exist inadvertently
-- (No-op if none exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'creator_earnings' 
      AND cmd IN ('UPDATE','DELETE')
      AND policyname IN ('Public can update creator earnings','Public can delete creator earnings')
  ) THEN
    RAISE EXCEPTION 'Unexpected public UPDATE/DELETE policies found on creator_earnings. Please review manually.';
  END IF;
END $$;