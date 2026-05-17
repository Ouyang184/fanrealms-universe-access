# Jam Voting System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a community voting system for FanRealms asset jams — submitters vote on each other's entries across three categories (Usefulness, Quality, Creativity), with live score leaderboards and a dedicated jam page.

**Architecture:** Three new DB tables (`jams`, `jam_submissions`, `jam_votes`) with RLS enforcing that only users who submitted an entry can vote, and no self-voting. A SQL view aggregates per-submission scores. A dedicated `/jam/:jamId` page shows submissions sorted by score with inline voting UI. The jam status (active / voting / ended) is derived from the jam's dates client-side so no background job is needed.

**Tech Stack:** React 18, TypeScript, Supabase (PostgreSQL, RLS, SQL view), TanStack Query, Tailwind CSS, shadcn/ui (Dialog, Button, Badge), Sonner toasts, React Router v6

---

## File Structure

| File | Action |
|---|---|
| `supabase/migrations/20260516100000-jam-voting-system.sql` | Create — tables, RLS, view, seed Jam #1 |
| `src/hooks/useJam.ts` | Create — all jam-related TanStack Query hooks |
| `src/pages/JamPage.tsx` | Create — main `/jam/:jamId` page |
| `src/components/jam/JamHeader.tsx` | Create — title, status badge, dates, prize breakdown |
| `src/components/jam/JamSubmissionCard.tsx` | Create — entry card with vote bars and inline voting |
| `src/components/jam/SubmitToJamDialog.tsx` | Create — dialog to pick a published product and submit |
| `src/App.tsx` | Modify — add `/jam/:jamId` route and import |

---

## Task 1: DB Migration — tables, view, RLS, seed Jam #1

**Files:**
- Create: `supabase/migrations/20260516100000-jam-voting-system.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260516100000-jam-voting-system.sql

-- ── jams ──────────────────────────────────────────────────────────────
CREATE TABLE public.jams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  thread_id       UUID REFERENCES public.forum_threads(id) ON DELETE SET NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,        -- submission deadline
  voting_ends_at  TIMESTAMPTZ NOT NULL,        -- voting deadline
  prize_pool      JSONB NOT NULL DEFAULT '[]', -- [{place:"1st",prize:"$60"}, ...]
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
  UNIQUE (jam_id, user_id)     -- one entry per person per jam
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
  UNIQUE (submission_id, voter_id)  -- one vote per submission per voter
);

ALTER TABLE public.jam_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON public.jam_votes FOR SELECT USING (true);

-- Only users who have submitted to the same jam may vote, and not on their own entry
CREATE POLICY "Submitters can vote on others entries"
  ON public.jam_votes FOR INSERT TO authenticated
  WITH CHECK (
    voter_id = auth.uid()
    -- not voting on own submission
    AND voter_id != (
      SELECT user_id FROM public.jam_submissions WHERE id = submission_id
    )
    -- voter must have their own submission in the same jam
    AND EXISTS (
      SELECT 1 FROM public.jam_submissions s
      WHERE s.user_id = auth.uid()
        AND s.jam_id = (SELECT jam_id FROM public.jam_submissions WHERE id = submission_id)
    )
  );

-- Allow updating an existing vote (change scores)
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

-- Public read access on the view
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
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use `mcp__plugin_supabase_supabase__apply_migration` with:
- `project_id`: `eaeqyctjljbtcatlohky`
- `name`: `jam_voting_system`
- `query`: the SQL above

- [ ] **Step 3: Verify tables exist**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('jams','jam_submissions','jam_votes');

SELECT id, title, starts_at, ends_at FROM public.jams;
```

Expected: 3 table rows + the Jam #1 row.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260516100000-jam-voting-system.sql
git commit -m "feat: add jams, jam_submissions, jam_votes tables with RLS and seed Jam #1"
```

---

## Task 2: `useJam.ts` — all hooks

**Files:**
- Create: `src/hooks/useJam.ts`

All jam data lives in this one file. Do not split.

- [ ] **Step 1: Create the file**

```ts
// src/hooks/useJam.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────

export type JamStatus = 'upcoming' | 'active' | 'voting' | 'ended';

export interface Jam {
  id: string;
  title: string;
  description: string | null;
  thread_id: string | null;
  starts_at: string;
  ends_at: string;
  voting_ends_at: string;
  prize_pool: { place: string; label: string; prize: string }[];
  created_at: string;
}

export interface JamSubmissionScore {
  id: string;
  jam_id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  avg_usefulness: number;
  avg_quality: number;
  avg_creativity: number;
  avg_overall: number;
  vote_count: number;
}

export interface JamVote {
  id: string;
  submission_id: string;
  voter_id: string;
  usefulness: number;
  quality: number;
  creativity: number;
}

// ── Status helper ──────────────────────────────────────────────────────

export function getJamStatus(jam: Jam): JamStatus {
  const now = Date.now();
  const starts = new Date(jam.starts_at).getTime();
  const ends = new Date(jam.ends_at).getTime();
  const votingEnds = new Date(jam.voting_ends_at).getTime();
  if (now < starts) return 'upcoming';
  if (now <= ends) return 'active';
  if (now <= votingEnds) return 'voting';
  return 'ended';
}

// ── Hooks ──────────────────────────────────────────────────────────────

export function useJam(jamId: string) {
  return useQuery({
    queryKey: ['jam', jamId],
    enabled: !!jamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jams')
        .select('*')
        .eq('id', jamId)
        .single();
      if (error) throw error;
      return data as Jam;
    },
  });
}

export function useJamSubmissions(jamId: string) {
  return useQuery({
    queryKey: ['jam-submissions', jamId],
    enabled: !!jamId,
    queryFn: async () => {
      // Scores from aggregated view
      const { data: scores, error: scoresError } = await supabase
        .from('jam_submission_scores')
        .select('*')
        .eq('jam_id', jamId)
        .order('avg_overall', { ascending: false });
      if (scoresError) throw scoresError;

      if (!scores || scores.length === 0) return [];

      // Enrich with product + user data
      const productIds = scores.map(s => s.product_id);
      const userIds = scores.map(s => s.user_id);

      const [{ data: products }, { data: users }] = await Promise.all([
        supabase
          .from('digital_products')
          .select('id, title, short_description, cover_image_url, category')
          .in('id', productIds),
        supabase
          .from('users')
          .select('id, username, display_name, profile_image_url')
          .in('id', userIds),
      ]);

      const productMap = Object.fromEntries((products ?? []).map(p => [p.id, p]));
      const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]));

      return (scores as JamSubmissionScore[]).map(s => ({
        ...s,
        product: productMap[s.product_id] ?? null,
        creator: userMap[s.user_id] ?? null,
      }));
    },
  });
}

// Returns the current user's submission for a jam (null = not submitted)
export function useMyJamSubmission(jamId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-jam-submission', jamId, user?.id],
    enabled: !!jamId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jam_submissions')
        .select('id, product_id')
        .eq('jam_id', jamId)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data; // null if not submitted
    },
  });
}

// Returns a map of submissionId → vote the current user cast
export function useMyJamVotes(jamId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-jam-votes', jamId, user?.id],
    enabled: !!jamId && !!user?.id,
    queryFn: async () => {
      // Get submission IDs for this jam
      const { data: subs } = await supabase
        .from('jam_submissions')
        .select('id')
        .eq('jam_id', jamId);

      if (!subs || subs.length === 0) return {} as Record<string, JamVote>;

      const subIds = subs.map(s => s.id);
      const { data: votes, error } = await supabase
        .from('jam_votes')
        .select('*')
        .eq('voter_id', user!.id)
        .in('submission_id', subIds);
      if (error) throw error;

      return Object.fromEntries(
        (votes ?? []).map(v => [v.submission_id, v as JamVote])
      );
    },
  });
}

export function useSubmitToJam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jamId, productId }: { jamId: string; productId: string }) => {
      const { data, error } = await supabase
        .from('jam_submissions')
        .insert({ jam_id: jamId, user_id: user!.id, product_id: productId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { jamId }) => {
      queryClient.invalidateQueries({ queryKey: ['jam-submissions', jamId] });
      queryClient.invalidateQueries({ queryKey: ['my-jam-submission', jamId] });
      toast.success('Entry submitted!');
    },
    onError: (err: Error) => {
      toast.error('Failed to submit: ' + err.message);
    },
  });
}

export function useVoteOnSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      jamId,
      usefulness,
      quality,
      creativity,
    }: {
      submissionId: string;
      jamId: string;
      usefulness: number;
      quality: number;
      creativity: number;
    }) => {
      const { data, error } = await supabase
        .from('jam_votes')
        .upsert(
          { submission_id: submissionId, voter_id: user!.id, usefulness, quality, creativity },
          { onConflict: 'submission_id,voter_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return { data, jamId };
    },
    onSuccess: ({ jamId }) => {
      queryClient.invalidateQueries({ queryKey: ['jam-submissions', jamId] });
      queryClient.invalidateQueries({ queryKey: ['my-jam-votes', jamId] });
      toast.success('Vote saved');
    },
    onError: (err: Error) => {
      toast.error('Vote failed: ' + err.message);
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

Expected: no errors from `useJam.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useJam.ts
git commit -m "feat: add useJam hooks for submissions, votes, and scoring"
```

---

## Task 3: `JamHeader.tsx` component

**Files:**
- Create: `src/components/jam/JamHeader.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/jam/JamHeader.tsx
import { Badge } from '@/components/ui/badge';
import { type Jam, getJamStatus } from '@/hooks/useJam';

interface Props {
  jam: Jam;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' },
  active:   { label: 'Submissions Open', color: 'bg-green-100 text-green-800' },
  voting:   { label: 'Voting Open', color: 'bg-blue-100 text-blue-800' },
  ended:    { label: 'Ended', color: 'bg-gray-100 text-gray-600' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function JamHeader({ jam }: Props) {
  const status = getJamStatus(jam);
  const { label, color } = STATUS_LABELS[status];

  return (
    <div className="border-b border-[#eee] pb-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-[26px] font-bold tracking-[-0.5px] text-[#111]">{jam.title}</h1>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${color}`}>
          {label}
        </span>
      </div>

      {jam.description && (
        <p className="text-[14px] text-[#555] mb-4">{jam.description}</p>
      )}

      <div className="flex flex-wrap gap-6 text-[13px] text-[#666] mb-5">
        <div>
          <span className="font-semibold text-[#333]">Submissions:</span>{' '}
          {fmt(jam.starts_at)} – {fmt(jam.ends_at)}
        </div>
        <div>
          <span className="font-semibold text-[#333]">Voting closes:</span>{' '}
          {fmt(jam.voting_ends_at)}
        </div>
      </div>

      {/* Prize breakdown */}
      <div className="flex flex-wrap gap-3">
        {jam.prize_pool.map((p) => (
          <div
            key={p.place}
            className="flex items-center gap-2 px-3 py-2 bg-[#fafafa] border border-[#eee] rounded-lg"
          >
            <span className="text-[12px] font-bold text-[#888]">{p.place}</span>
            <span className="text-[12px] text-[#555]">{p.label}</span>
            <span className="text-[13px] font-bold text-primary">{p.prize}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/jam/JamHeader.tsx
git commit -m "feat: add JamHeader component with status badge and prize breakdown"
```

---

## Task 4: `JamSubmissionCard.tsx` — entry card with voting UI

**Files:**
- Create: `src/components/jam/JamSubmissionCard.tsx`

The card shows product info, score bars, and (when eligible) inline 1–5 voting per category.

- [ ] **Step 1: Create the file**

```tsx
// src/components/jam/JamSubmissionCard.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVoteOnSubmission, type JamVote, type JamStatus } from '@/hooks/useJam';

interface Submission {
  id: string;
  product_id: string;
  user_id: string;
  avg_usefulness: number;
  avg_quality: number;
  avg_creativity: number;
  avg_overall: number;
  vote_count: number;
  product: {
    id: string;
    title: string;
    short_description: string | null;
    cover_image_url: string | null;
    category: string | null;
  } | null;
  creator: {
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
  } | null;
}

interface Props {
  submission: Submission;
  jamId: string;
  jamStatus: JamStatus;
  mySubmissionId: string | null; // null = user hasn't submitted
  myVote: JamVote | null;
  currentUserId: string | null;
  rank: number;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px] text-[#888]">
        <span>{label}</span>
        <span className="font-semibold text-[#555]">{value > 0 ? value.toFixed(1) : '—'}</span>
      </div>
      <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: value > 0 ? `${(value / 5) * 100}%` : '0%' }}
        />
      </div>
    </div>
  );
}

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium text-[#555]">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className={`text-[20px] leading-none transition-colors ${
              n <= (hovered || value) ? 'text-yellow-400' : 'text-[#ddd]'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function JamSubmissionCard({
  submission,
  jamId,
  jamStatus,
  mySubmissionId,
  myVote,
  currentUserId,
  rank,
}: Props) {
  const voteOnSubmission = useVoteOnSubmission();
  const isOwnEntry = submission.user_id === currentUserId;
  const canVote =
    jamStatus === 'voting' &&
    !!mySubmissionId &&
    !isOwnEntry;

  const [usefulness, setUsefulness] = useState(myVote?.usefulness ?? 0);
  const [quality, setQuality] = useState(myVote?.quality ?? 0);
  const [creativity, setCreativity] = useState(myVote?.creativity ?? 0);

  const handleVoteChange = async (
    category: 'usefulness' | 'quality' | 'creativity',
    value: number
  ) => {
    const next = {
      usefulness: category === 'usefulness' ? value : usefulness,
      quality:    category === 'quality'    ? value : quality,
      creativity: category === 'creativity' ? value : creativity,
    };
    if (category === 'usefulness') setUsefulness(value);
    if (category === 'quality')    setQuality(value);
    if (category === 'creativity') setCreativity(value);

    // Submit immediately when all three are rated
    if (next.usefulness > 0 && next.quality > 0 && next.creativity > 0) {
      await voteOnSubmission.mutateAsync({
        submissionId: submission.id,
        jamId,
        ...next,
      });
    }
  };

  const product = submission.product;
  const creator = submission.creator;

  return (
    <div className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:border-[#ddd] transition-colors">
      {/* Cover */}
      <div className="relative aspect-video bg-[#f5f5f5] flex items-center justify-center">
        {product?.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[12px] text-[#bbb]">No preview</span>
        )}
        {/* Rank badge */}
        <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-[12px] font-bold text-[#555] shadow-sm border border-[#eee]">
          {rank}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Title + creator */}
        <div>
          <Link
            to={`/marketplace/${submission.product_id}`}
            className="text-[14px] font-bold text-[#111] hover:text-primary transition-colors line-clamp-1"
          >
            {product?.title ?? 'Untitled'}
          </Link>
          <div className="text-[12px] text-[#888]">
            by {creator?.display_name || creator?.username || 'Unknown'}
            {product?.category && (
              <span className="ml-2 text-[#bbb]">· {product.category}</span>
            )}
          </div>
        </div>

        {/* Score bars */}
        <div className="space-y-2">
          <ScoreBar label="Usefulness" value={submission.avg_usefulness} />
          <ScoreBar label="Quality"    value={submission.avg_quality} />
          <ScoreBar label="Creativity" value={submission.avg_creativity} />
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <span className="font-bold text-primary text-[15px]">
            {submission.avg_overall > 0 ? submission.avg_overall.toFixed(1) : '—'}
            <span className="text-[11px] text-[#aaa] font-normal"> / 5</span>
          </span>
          <span className="text-[#aaa]">
            {submission.vote_count} {submission.vote_count === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        {/* Voting UI */}
        {canVote && (
          <div className="pt-2 border-t border-[#f0f0f0] space-y-3">
            <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wide">
              Your rating
            </p>
            <StarPicker label="Usefulness" value={usefulness} onChange={v => handleVoteChange('usefulness', v)} />
            <StarPicker label="Quality"    value={quality}    onChange={v => handleVoteChange('quality', v)} />
            <StarPicker label="Creativity" value={creativity} onChange={v => handleVoteChange('creativity', v)} />
            {usefulness > 0 && quality > 0 && creativity > 0 && (
              <p className="text-[11px] text-green-600 font-medium">Vote saved</p>
            )}
            {(usefulness === 0 || quality === 0 || creativity === 0) && (
              <p className="text-[11px] text-[#aaa]">Rate all 3 categories to submit your vote</p>
            )}
          </div>
        )}

        {isOwnEntry && (
          <p className="text-[11px] text-[#aaa] pt-1 border-t border-[#f0f0f0]">This is your entry</p>
        )}

        {jamStatus === 'voting' && !mySubmissionId && currentUserId && (
          <p className="text-[11px] text-[#aaa] pt-1 border-t border-[#f0f0f0]">
            Submit an entry to unlock voting
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/jam/JamSubmissionCard.tsx
git commit -m "feat: add JamSubmissionCard with score bars and inline star voting"
```

---

## Task 5: `SubmitToJamDialog.tsx` — pick a product and submit

**Files:**
- Create: `src/components/jam/SubmitToJamDialog.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/jam/SubmitToJamDialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreatorProducts } from '@/hooks/useMarketplace';
import { useSubmitToJam } from '@/hooks/useJam';

interface Props {
  jamId: string;
  open: boolean;
  onClose: () => void;
}

export function SubmitToJamDialog({ jamId, open, onClose }: Props) {
  const { data: products, isLoading } = useCreatorProducts();
  const submitToJam = useSubmitToJam();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const published = (products ?? []).filter((p: any) => p.status === 'published');

  const handleSubmit = async () => {
    if (!selectedId) return;
    await submitToJam.mutateAsync({ jamId, productId: selectedId });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your entry</DialogTitle>
          <DialogDescription>
            Choose one of your published assets to enter in the jam.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-[13px] text-[#888] py-4">Loading your assets…</p>
        ) : published.length === 0 ? (
          <div className="py-4 space-y-2">
            <p className="text-[13px] text-[#555]">
              You have no published assets. Upload and publish one first.
            </p>
            <a
              href="/dashboard/assets/new"
              className="text-[13px] text-primary hover:underline"
            >
              Upload an asset →
            </a>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto py-2">
            {published.map((p: any) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  selectedId === p.id
                    ? 'border-primary bg-primary/5'
                    : 'border-[#eee] hover:border-[#ddd] hover:bg-[#fafafa]'
                }`}
              >
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-[#f0f0f0] flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{p.title}</div>
                  <div className="text-[11px] text-[#888]">{p.category}</div>
                </div>
                {selectedId === p.id && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedId || submitToJam.isPending}
            className="flex-1"
          >
            {submitToJam.isPending ? 'Submitting…' : 'Submit entry'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/jam/SubmitToJamDialog.tsx
git commit -m "feat: add SubmitToJamDialog for picking a published asset to enter"
```

---

## Task 6: `JamPage.tsx` — main page

**Files:**
- Create: `src/pages/JamPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/pages/JamPage.tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useJam,
  useJamSubmissions,
  useMyJamSubmission,
  useMyJamVotes,
  getJamStatus,
} from '@/hooks/useJam';
import { useAuth } from '@/contexts/AuthContext';
import { JamHeader } from '@/components/jam/JamHeader';
import { JamSubmissionCard } from '@/components/jam/JamSubmissionCard';
import { SubmitToJamDialog } from '@/components/jam/SubmitToJamDialog';

export default function JamPage() {
  const { jamId } = useParams<{ jamId: string }>();
  const { user } = useAuth();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const { data: jam, isLoading: jamLoading } = useJam(jamId ?? '');
  const { data: submissions, isLoading: subsLoading } = useJamSubmissions(jamId ?? '');
  const { data: mySubmission } = useMyJamSubmission(jamId ?? '');
  const { data: myVotes = {} } = useMyJamVotes(jamId ?? '');

  if (jamLoading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-16 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!jam) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-[15px] font-semibold text-[#111]">Jam not found</p>
          <Link to="/forum" className="text-primary text-[13px] hover:underline mt-2 block">
            ← Back to forum
          </Link>
        </div>
      </MainLayout>
    );
  }

  const status = getJamStatus(jam);
  const canSubmit = status === 'active' && !!user && !mySubmission;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          to={jam.thread_id ? `/forum/${jam.thread_id}` : '/forum'}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#111] transition-colors mb-6"
        >
          ← Forum thread
        </Link>

        <JamHeader jam={jam} />

        {/* CTA row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[16px] font-bold text-[#111]">
            Submissions{' '}
            {submissions && (
              <span className="text-[#aaa] font-normal text-[14px]">
                ({submissions.length})
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {mySubmission && (
              <span className="text-[12px] text-green-600 font-medium">
                Your entry is submitted
              </span>
            )}
            {canSubmit && (
              <Button onClick={() => setShowSubmitDialog(true)}>
                Submit your entry
              </Button>
            )}
            {!user && status === 'active' && (
              <Link to="/login">
                <Button variant="outline">Sign in to submit</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Submissions grid */}
        {subsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-12 text-center">
            <p className="text-[15px] font-semibold text-[#111] mb-1">No submissions yet</p>
            <p className="text-[13px] text-[#999]">
              Be the first to upload a Godot asset and enter the jam.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((s, i) => (
              <JamSubmissionCard
                key={s.id}
                submission={s}
                jamId={jamId!}
                jamStatus={status}
                mySubmissionId={mySubmission?.id ?? null}
                myVote={myVotes[s.id] ?? null}
                currentUserId={user?.id ?? null}
                rank={i + 1}
              />
            ))}
          </div>
        )}

        <SubmitToJamDialog
          jamId={jamId!}
          open={showSubmitDialog}
          onClose={() => setShowSubmitDialog(false)}
        />
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/JamPage.tsx
git commit -m "feat: add JamPage with submission grid and voting UI"
```

---

## Task 7: Wire up route and link in forum thread

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import for JamPage**

At the top of `src/App.tsx`, add after the existing page imports:

```tsx
import JamPage from './pages/JamPage';
```

- [ ] **Step 2: Add route**

Find the line with `/forum/:threadId` route and add the jam route directly after it:

```tsx
<Route path="/forum/:threadId" element={<ForumThread />} />
<Route path="/jam/:jamId" element={<JamPage />} />
```

- [ ] **Step 3: Fetch the Jam #1 ID and update the forum thread content**

The Jam #1 ID can be retrieved with:
```sql
SELECT id FROM public.jams WHERE title = 'FanRealms Asset Jam #1';
```

Then update the forum thread to add a link to the jam page at the bottom of the content:

```sql
UPDATE public.forum_threads
SET content = content || E'\n\n---\n\n[View submissions and vote on entries →](/jam/<JAM_ID>)'
WHERE id = '1fa93541-2ead-4a4d-a9c6-aa34231655fd';
```

Replace `<JAM_ID>` with the actual UUID from the query above.

- [ ] **Step 4: Final build check**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in Xs` with no errors.

- [ ] **Step 5: Commit and push**

```bash
git add src/App.tsx
git commit -m "feat: add /jam/:jamId route and link from forum thread"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- Submissions: ✅ `jam_submissions` table, `useSubmitToJam`, `SubmitToJamDialog`
- Voting: ✅ `jam_votes` table with upsert, `useVoteOnSubmission`, `StarPicker` in `JamSubmissionCard`
- Only submitters vote: ✅ RLS `WITH CHECK` on `jam_votes` verifies voter has a submission in same jam
- No self-voting: ✅ RLS `voter_id != user_id of submission`
- Score aggregation: ✅ `jam_submission_scores` view with avg per category + overall
- Sorted leaderboard: ✅ `useJamSubmissions` orders by `avg_overall DESC`
- Status lifecycle: ✅ `getJamStatus()` derives from dates, no cron needed
- Jam page: ✅ `JamPage.tsx` with header, grid, submit CTA
- Seed Jam #1: ✅ INSERT in migration

**Placeholder scan:** No TBD, TODO, or vague steps found.

**Type consistency:**
- `JamSubmissionScore` used in `useJamSubmissions` return — spread into `JamSubmissionCard` props ✅
- `JamVote` used in `useMyJamVotes` return type and `JamSubmissionCard.myVote` prop ✅
- `JamStatus` string union used in `getJamStatus` return and `JamSubmissionCard.jamStatus` prop ✅
- `Jam.prize_pool` is `{place, label, prize}[]` — matches usage in `JamHeader` ✅
