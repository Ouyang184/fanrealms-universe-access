-- supabase/migrations/20260514000000-add-asset-file-path.sql

-- Add asset_file_path column to store Supabase Storage paths
-- asset_url is kept for backward compat with existing external-URL assets
ALTER TABLE digital_products
  ADD COLUMN IF NOT EXISTS asset_file_path TEXT;

-- Create private product-files bucket (50 MB size limit, not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-files', 'product-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;
