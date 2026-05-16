DROP POLICY IF EXISTS "Authenticated users can submit their own entry" ON public.jam_submissions;

CREATE POLICY "Authenticated users can submit their own entry"
  ON public.jam_submissions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jams j
      WHERE j.id = jam_id
        AND now() >= j.starts_at
        AND now() <= j.ends_at
    )
  );
