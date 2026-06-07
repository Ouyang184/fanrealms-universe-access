-- Donations: lets fans optionally tip a creator on a FREE asset.
-- Recorded separately from purchases (purchases has a unique buyer/product
-- constraint used by free downloads, and a tip is not a purchase). The webhook
-- also writes a creator_earnings row (earning_type='donation') so tips show up
-- in the creator's balance.
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.digital_products(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  stripe_session_id text UNIQUE,         -- idempotency guard for the webhook
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Donors can view their own donations" ON public.donations;
CREATE POLICY "Donors can view their own donations" ON public.donations
  FOR SELECT TO authenticated
  USING (donor_id = auth.uid());

DROP POLICY IF EXISTS "Creators can view donations received" ON public.donations;
CREATE POLICY "Creators can view donations received" ON public.donations
  FOR SELECT TO authenticated
  USING (creator_id IN (SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()));

-- Only the service role (webhook) inserts donations; no client inserts.
CREATE INDEX IF NOT EXISTS idx_donations_creator_id ON public.donations(creator_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations(donor_id);

-- stripe_session_id is sensitive; keep it from clients
REVOKE SELECT (stripe_session_id) ON public.donations FROM anon, authenticated;
