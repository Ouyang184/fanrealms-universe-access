-- Add external links support to commission_deliverables
ALTER TABLE public.commission_deliverables
ADD COLUMN IF NOT EXISTS external_links text[] NOT NULL DEFAULT '{}';