-- supabase/migrations/20260516100000-jam-voting-system.sql

-- ── jams ──────────────────────────────────────────────────────────────
CREATE TABLE public.jams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  thread_id       UUID REFERENCES public.forum_threads(id) ON DELETE SET NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  voting_ends_at  TIMESTAMPTZ NOT NULL,
  prize_pool      JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view jams"
  ON public.jams FOR SELECT USING (true);

-- ── jam_submissions ────────────────────────────────────────────────────
CREATE TABLE public.jam_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id      UUID NOT NULL REFERENCES public.jams(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (jam_id, user_id)
);

ALTER TABLE public.jam_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submissions"
  ON public.jam_submissions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit their own entry"
  ON public.jam_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own submission"
  ON public.jam_submissions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── jam_votes ──────────────────────────────────────────────────────────
CREATE TABLE public.jam_votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.jam_submissions(id) ON DELETE CASCADE,
  voter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usefulness    SMALLINT NOT NULL CHECK (usefulness BETWEEN 1 AND 5),
  quality       SMALLINT NOT NULL CHECK (quality BETWEEN 1 AND 5),
  creativity    SMALLINT NOT NULL CHECK (creativity BETWEEN 1 AND 5),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, voter_id)
);

ALTER TABLE public.jam_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON public.jam_votes FOR SELECT USING (true);

CREATE POLICY "Submitters can vote on others entries"
  ON public.jam_votes FOR INSERT TO authenticated
  WITH CHECK (
    voter_id = auth.uid()
    AND voter_id != (
      SELECT user_id FROM public.jam_submissions WHERE id = submission_id
    )
    AND EXISTS (
      SELECT 1 FROM public.jam_submissions s
      WHERE s.user_id = auth.uid()
        AND s.jam_id = (SELECT jam_id FROM public.jam_submissions WHERE id = submission_id)
    )
  );

CREATE POLICY "Voters can update their own votes"
  ON public.jam_votes FOR UPDATE TO authenticated
  USING (voter_id = auth.uid())
  WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Voters can delete their own votes"
  ON public.jam_votes FOR DELETE TO authenticated
  USING (voter_id = auth.uid());

-- ── Aggregated scores view ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.jam_submission_scores AS
SELECT
  js.id,
  js.jam_id,
  js.user_id,
  js.product_id,
  js.created_at,
  COALESCE(ROUND(AVG(jv.usefulness)::NUMERIC, 1), 0)  AS avg_usefulness,
  COALESCE(ROUND(AVG(jv.quality)::NUMERIC, 1), 0)     AS avg_quality,
  COALESCE(ROUND(AVG(jv.creativity)::NUMERIC, 1), 0)  AS avg_creativity,
  COALESCE(
    ROUND(((AVG(jv.usefulness) + AVG(jv.quality) + AVG(jv.creativity)) / 3)::NUMERIC, 1),
    0
  )                                                    AS avg_overall,
  COUNT(jv.id)::INT                                    AS vote_count
FROM public.jam_submissions js
LEFT JOIN public.jam_votes jv ON jv.submission_id = js.id
GROUP BY js.id, js.jam_id, js.user_id, js.product_id, js.created_at;

GRANT SELECT ON public.jam_submission_scores TO anon, authenticated;

-- ── Seed Jam #1 ────────────────────────────────────────────────────────
INSERT INTO public.jams (title, description, thread_id, starts_at, ends_at, voting_ends_at, prize_pool)
VALUES (
  'FanRealms Asset Jam #1',
  'Create an original Godot 4 asset, upload it to FanRealms, and win cash prizes.',
  '1fa93541-2ead-4a4d-a9c6-aa34231655fd',
  '2026-05-19 00:00:00+00',
  '2026-06-02 23:59:59+00',
  '2026-06-04 23:59:59+00',
  '[{"place":"1st","label":"Best Overall","prize":"$60"},{"place":"2nd","label":"Runner Up","prize":"$30"},{"place":"3rd","label":"Most Creative","prize":"$10"}]'
);
