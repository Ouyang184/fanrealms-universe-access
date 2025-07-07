
-- Create commission_types table for services offered by creators
CREATE TABLE public.commission_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_character NUMERIC(10,2) DEFAULT 0,
  price_per_revision NUMERIC(10,2) DEFAULT 0,
  estimated_turnaround_days INTEGER DEFAULT 7,
  max_revisions INTEGER DEFAULT 3,
  dos TEXT[], -- Array of things the creator will do
  donts TEXT[], -- Array of things the creator won't do
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create commission_slots table for available booking slots
CREATE TABLE public.commission_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  commission_type_id UUID NOT NULL REFERENCES public.commission_types(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  custom_price NUMERIC(10,2), -- Override base price if needed
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create commission_requests table for customer orders
CREATE TABLE public.commission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.commission_slots(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  commission_type_id UUID NOT NULL REFERENCES public.commission_types(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_images TEXT[], -- Array of image URLs
  budget_range_min NUMERIC(10,2),
  budget_range_max NUMERIC(10,2),
  agreed_price NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
  deadline DATE,
  customer_notes TEXT,
  creator_notes TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create commission_tags table for specialized art styles/genres
CREATE TABLE public.commission_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., 'style', 'genre', 'medium'
  description TEXT,
  color_hex TEXT DEFAULT '#3B82F6',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create commission_portfolios table for showcase images
CREATE TABLE public.commission_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  commission_type_id UUID REFERENCES public.commission_types(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT[], -- Array of tag names
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create junction table for commission types and tags
CREATE TABLE public.commission_type_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_type_id UUID NOT NULL REFERENCES public.commission_types(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.commission_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(commission_type_id, tag_id)
);

-- Add commission-related fields to creators table
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS 
  commission_slots_available INTEGER DEFAULT 0,
  commission_base_rate NUMERIC(10,2) DEFAULT 0,
  commission_turnaround_days INTEGER DEFAULT 7,
  accepts_commissions BOOLEAN DEFAULT false,
  commission_tos TEXT; -- Terms of service for commissions

-- Enable Row Level Security for all commission tables
ALTER TABLE public.commission_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_type_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commission_types
CREATE POLICY "Anyone can view commission types" ON public.commission_types
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their own commission types" ON public.commission_types
  FOR ALL USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- RLS Policies for commission_slots
CREATE POLICY "Anyone can view available commission slots" ON public.commission_slots
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their own commission slots" ON public.commission_slots
  FOR ALL USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- RLS Policies for commission_requests
CREATE POLICY "Users can view their own commission requests" ON public.commission_requests
  FOR SELECT USING (customer_id = auth.uid() OR creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE POLICY "Users can create commission requests" ON public.commission_requests
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Creators can update requests for their commissions" ON public.commission_requests
  FOR UPDATE USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own requests" ON public.commission_requests
  FOR UPDATE USING (customer_id = auth.uid());

-- RLS Policies for commission_tags
CREATE POLICY "Anyone can view commission tags" ON public.commission_tags
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage commission tags" ON public.commission_tags
  FOR ALL USING (false); -- This will be updated when admin roles are implemented

-- RLS Policies for commission_portfolios
CREATE POLICY "Anyone can view commission portfolios" ON public.commission_portfolios
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their own commission portfolios" ON public.commission_portfolios
  FOR ALL USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- RLS Policies for commission_type_tags
CREATE POLICY "Anyone can view commission type tags" ON public.commission_type_tags
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their own commission type tags" ON public.commission_type_tags
  FOR ALL USING (commission_type_id IN (SELECT id FROM public.commission_types WHERE creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())));

-- Create indexes for better performance
CREATE INDEX idx_commission_types_creator_id ON public.commission_types(creator_id);
CREATE INDEX idx_commission_slots_creator_id ON public.commission_slots(creator_id);
CREATE INDEX idx_commission_slots_date ON public.commission_slots(slot_date);
CREATE INDEX idx_commission_requests_customer_id ON public.commission_requests(customer_id);
CREATE INDEX idx_commission_requests_creator_id ON public.commission_requests(creator_id);
CREATE INDEX idx_commission_requests_status ON public.commission_requests(status);
CREATE INDEX idx_commission_portfolios_creator_id ON public.commission_portfolios(creator_id);
CREATE INDEX idx_commission_type_tags_commission_type_id ON public.commission_type_tags(commission_type_id);
CREATE INDEX idx_commission_type_tags_tag_id ON public.commission_type_tags(tag_id);

-- Insert some sample commission tags
INSERT INTO public.commission_tags (name, category, description, color_hex, is_featured) VALUES
  ('Portrait', 'type', 'Character portraits and headshots', '#FF6B6B', true),
  ('Full Body', 'type', 'Complete character illustrations', '#4ECDC4', true),
  ('Couple', 'type', 'Two character illustrations', '#45B7D1', true),
  ('Semi-Realistic', 'style', 'Semi-realistic art style', '#96CEB4', true),
  ('Anime', 'style', 'Anime/manga art style', '#FFEAA7', true),
  ('Cartoon', 'style', 'Cartoon art style', '#DDA0DD', true),
  ('DnD', 'genre', 'Dungeons & Dragons characters', '#FF7675', true),
  ('Fantasy', 'genre', 'Fantasy themed artwork', '#74B9FF', true),
  ('Sci-Fi', 'genre', 'Science fiction themes', '#00B894', true),
  ('NSFW', 'content', 'Adult content', '#E17055', false),
  ('SFW', 'content', 'Safe for work content', '#00B894', true);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_commission_types_updated_at BEFORE UPDATE ON public.commission_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_slots_updated_at BEFORE UPDATE ON public.commission_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_requests_updated_at BEFORE UPDATE ON public.commission_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
