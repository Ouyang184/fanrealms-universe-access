
-- Add commission-related columns to the creators table
ALTER TABLE public.creators 
ADD COLUMN accepts_commissions BOOLEAN DEFAULT false,
ADD COLUMN commission_base_rate NUMERIC DEFAULT NULL,
ADD COLUMN commission_turnaround_days INTEGER DEFAULT NULL,
ADD COLUMN commission_slots_available INTEGER DEFAULT NULL,
ADD COLUMN commission_tos TEXT DEFAULT NULL;

-- Create the commission_types table
CREATE TABLE public.commission_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC NOT NULL,
  price_per_character NUMERIC DEFAULT NULL,
  price_per_revision NUMERIC DEFAULT NULL,
  estimated_turnaround_days INTEGER NOT NULL,
  max_revisions INTEGER NOT NULL DEFAULT 3,
  dos TEXT[] DEFAULT '{}',
  donts TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on commission_types
ALTER TABLE public.commission_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for commission_types
CREATE POLICY "Anyone can view commission types" 
  ON public.commission_types 
  FOR SELECT 
  USING (true);

CREATE POLICY "Creators can manage their own commission types" 
  ON public.commission_types 
  FOR ALL 
  USING (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ))
  WITH CHECK (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_commission_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_commission_types_updated_at
  BEFORE UPDATE ON public.commission_types
  FOR EACH ROW EXECUTE FUNCTION update_commission_types_updated_at();
