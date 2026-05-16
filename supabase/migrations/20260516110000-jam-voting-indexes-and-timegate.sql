-- Fix 1: Indexes for jam_submissions and jam_votes
CREATE INDEX idx_jam_submissions_jam_id  ON public.jam_submissions(jam_id);
CREATE INDEX idx_jam_submissions_user_id ON public.jam_submissions(user_id);
CREATE INDEX idx_jam_votes_submission_id ON public.jam_votes(submission_id);
CREATE INDEX idx_jam_votes_voter_id      ON public.jam_votes(voter_id);

-- Fix 2: Date ordering constraint on jams
ALTER TABLE public.jams
  ADD CONSTRAINT jams_date_order
  CHECK (starts_at < ends_at AND ends_at < voting_ends_at);

-- Fix 3: Time-gate on jam_votes INSERT (voting window = ends_at to voting_ends_at)
DROP POLICY IF EXISTS "Submitters can vote on others entries" ON public.jam_votes;

CREATE POLICY "Submitters can vote on others entries"
  ON public.jam_votes FOR INSERT TO authenticated
  WITH CHECK (
    voter_id = auth.uid()
    -- no self-voting
    AND voter_id != (
      SELECT user_id FROM public.jam_submissions WHERE id = submission_id
    )
    -- voter must have a submission in the same jam
    AND EXISTS (
      SELECT 1 FROM public.jam_submissions s
      WHERE s.user_id = auth.uid()
        AND s.jam_id = (SELECT jam_id FROM public.jam_submissions WHERE id = submission_id)
    )
    -- voting window: between submission deadline and voting deadline
    AND EXISTS (
      SELECT 1 FROM public.jams j
      JOIN public.jam_submissions sub ON sub.jam_id = j.id
      WHERE sub.id = submission_id
        AND now() BETWEEN j.ends_at AND j.voting_ends_at
    )
  );

-- Fix 4: Time-gate on jam_votes UPDATE (same window)
DROP POLICY IF EXISTS "Voters can update their own votes" ON public.jam_votes;

CREATE POLICY "Voters can update their own votes"
  ON public.jam_votes FOR UPDATE TO authenticated
  USING (voter_id = auth.uid())
  WITH CHECK (
    voter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jams j
      JOIN public.jam_submissions sub ON sub.jam_id = j.id
      WHERE sub.id = submission_id
        AND now() BETWEEN j.ends_at AND j.voting_ends_at
    )
  );
