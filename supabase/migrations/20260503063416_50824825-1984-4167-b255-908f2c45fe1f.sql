
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS classification text DEFAULT 'game',
  ADD COLUMN IF NOT EXISTS kind text DEFAULT 'downloadable',
  ADD COLUMN IF NOT EXISTS release_status text DEFAULT 'released',
  ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS suggested_price_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS screenshots text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS genre text,
  ADD COLUMN IF NOT EXISTS ai_disclosure text,
  ADD COLUMN IF NOT EXISTS app_store_links jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS community_mode text DEFAULT 'comments',
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'draft';
