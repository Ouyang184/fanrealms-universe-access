-- Marketplace Tables
CREATE TABLE public.digital_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  asset_url text,
  cover_image_url text,
  category text DEFAULT 'other',
  tags text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'draft',
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published products" ON public.digital_products FOR SELECT USING (status = 'published');
CREATE POLICY "Creators can manage their own products" ON public.digital_products FOR ALL TO authenticated USING (creator_id IN (SELECT c.id FROM creators c WHERE c.user_id = auth.uid())) WITH CHECK (creator_id IN (SELECT c.id FROM creators c WHERE c.user_id = auth.uid()));
CREATE INDEX idx_digital_products_creator ON public.digital_products(creator_id);
CREATE INDEX idx_digital_products_status ON public.digital_products(status);
CREATE INDEX idx_digital_products_category ON public.digital_products(category);

CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can view own purchases" ON public.purchases FOR SELECT TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "Creators can view sales of their products" ON public.purchases FOR SELECT TO authenticated USING (creator_id IN (SELECT c.id FROM creators c WHERE c.user_id = auth.uid()));
CREATE POLICY "Service role can insert purchases" ON public.purchases FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');
CREATE INDEX idx_purchases_buyer ON public.purchases(buyer_id);
CREATE INDEX idx_purchases_product ON public.purchases(product_id);

-- Job Board Tables
CREATE TABLE public.job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  requirements text,
  category text NOT NULL DEFAULT 'Other',
  budget_min numeric,
  budget_max numeric,
  budget_type text NOT NULL DEFAULT 'fixed',
  status text NOT NULL DEFAULT 'open',
  tags text[] DEFAULT '{}'::text[],
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view open job listings" ON public.job_listings FOR SELECT USING (status = 'open');
CREATE POLICY "Posters can view their own listings" ON public.job_listings FOR SELECT TO authenticated USING (poster_id = auth.uid());
CREATE POLICY "Authenticated users can create job listings" ON public.job_listings FOR INSERT TO authenticated WITH CHECK (poster_id = auth.uid());
CREATE POLICY "Posters can update their own listings" ON public.job_listings FOR UPDATE TO authenticated USING (poster_id = auth.uid()) WITH CHECK (poster_id = auth.uid());
CREATE POLICY "Posters can delete their own listings" ON public.job_listings FOR DELETE TO authenticated USING (poster_id = auth.uid());
CREATE INDEX idx_job_listings_poster ON public.job_listings(poster_id);
CREATE INDEX idx_job_listings_status ON public.job_listings(status);
CREATE INDEX idx_job_listings_category ON public.job_listings(category);

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  cover_letter text,
  portfolio_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT TO authenticated USING (applicant_id = auth.uid());
CREATE POLICY "Posters can view applications on their listings" ON public.job_applications FOR SELECT TO authenticated USING (listing_id IN (SELECT jl.id FROM job_listings jl WHERE jl.poster_id = auth.uid()));
CREATE POLICY "Authenticated users can apply" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "Posters can update application status" ON public.job_applications FOR UPDATE TO authenticated USING (listing_id IN (SELECT jl.id FROM job_listings jl WHERE jl.poster_id = auth.uid()));
CREATE INDEX idx_job_applications_listing ON public.job_applications(listing_id);
CREATE INDEX idx_job_applications_applicant ON public.job_applications(applicant_id);

-- Forum Tables
CREATE TABLE public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'General',
  tags text[] DEFAULT '{}'::text[],
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published threads" ON public.forum_threads FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can view their own threads" ON public.forum_threads FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Authenticated users can create threads" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update their own threads" ON public.forum_threads FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can delete their own threads" ON public.forum_threads FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE INDEX idx_forum_threads_author ON public.forum_threads(author_id);
CREATE INDEX idx_forum_threads_category ON public.forum_threads(category);
CREATE INDEX idx_forum_threads_status ON public.forum_threads(status);

CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view replies on published threads" ON public.forum_replies FOR SELECT USING (thread_id IN (SELECT ft.id FROM forum_threads ft WHERE ft.status = 'published'));
CREATE POLICY "Authenticated users can create replies" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update their own replies" ON public.forum_replies FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can delete their own replies" ON public.forum_replies FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE INDEX idx_forum_replies_thread ON public.forum_replies(thread_id);
CREATE INDEX idx_forum_replies_author ON public.forum_replies(author_id);
CREATE INDEX idx_forum_replies_parent ON public.forum_replies(parent_reply_id);

-- Auto-update reply count trigger
CREATE OR REPLACE FUNCTION update_thread_reply_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads SET reply_count = reply_count + 1, updated_at = now() WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads SET reply_count = GREATEST(reply_count - 1, 0), updated_at = now() WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_thread_reply_count AFTER INSERT OR DELETE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();