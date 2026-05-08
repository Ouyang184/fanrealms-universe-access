-- Sales (discount periods)
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  name text NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sale_id, project_id)
);

-- Bundles
CREATE TABLE public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  bundle_price integer NOT NULL CHECK (bundle_price >= 0),
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bundle_id, project_id)
);

CREATE TABLE public.bundle_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL,
  amount_paid integer NOT NULL,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper: is a creator owned by current user
CREATE OR REPLACE FUNCTION public.is_creator_owner(_creator_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM creators WHERE id = _creator_id AND user_id = auth.uid());
$$;

-- Eligibility check: project has digital_product with asset_url + price > 0
CREATE OR REPLACE FUNCTION public.is_project_sale_eligible(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM digital_products
    WHERE project_id = _project_id
      AND asset_url IS NOT NULL
      AND price > 0
  );
$$;

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;

-- sales: public read of active/scheduled, creator manages own
CREATE POLICY "Public can view sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Creators manage own sales" ON public.sales FOR ALL TO authenticated
  USING (public.is_creator_owner(creator_id))
  WITH CHECK (public.is_creator_owner(creator_id));

CREATE POLICY "Public can view sale items" ON public.sale_items FOR SELECT USING (true);
CREATE POLICY "Creators manage own sale items" ON public.sale_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id AND public.is_creator_owner(s.creator_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id AND public.is_creator_owner(s.creator_id)));

CREATE POLICY "Public can view published bundles" ON public.bundles FOR SELECT
  USING (status = 'published' OR public.is_creator_owner(creator_id));
CREATE POLICY "Creators manage own bundles" ON public.bundles FOR ALL TO authenticated
  USING (public.is_creator_owner(creator_id))
  WITH CHECK (public.is_creator_owner(creator_id));

CREATE POLICY "Public can view bundle items" ON public.bundle_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_id AND (b.status = 'published' OR public.is_creator_owner(b.creator_id))));
CREATE POLICY "Creators manage own bundle items" ON public.bundle_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_id AND public.is_creator_owner(b.creator_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_id AND public.is_creator_owner(b.creator_id)));

CREATE POLICY "Buyers can view own bundle purchases" ON public.bundle_purchases FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());
CREATE POLICY "Creators can view bundle purchases for own bundles" ON public.bundle_purchases FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_id AND public.is_creator_owner(b.creator_id)));
CREATE POLICY "Service role inserts bundle purchases" ON public.bundle_purchases FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_sales_creator ON public.sales(creator_id);
CREATE INDEX idx_sale_items_project ON public.sale_items(project_id);
CREATE INDEX idx_bundles_creator ON public.bundles(creator_id);
CREATE INDEX idx_bundle_items_project ON public.bundle_items(project_id);