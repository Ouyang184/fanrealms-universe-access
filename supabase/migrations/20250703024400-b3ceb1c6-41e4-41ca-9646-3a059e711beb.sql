
-- Create commission_requests table
CREATE TABLE public.commission_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_type_id UUID NOT NULL REFERENCES public.commission_types(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_images TEXT[] DEFAULT '{}',
  budget_range_min NUMERIC,
  budget_range_max NUMERIC,
  agreed_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
  deadline TIMESTAMP WITH TIME ZONE,
  customer_notes TEXT,
  creator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Customers can view their own requests" 
  ON public.commission_requests 
  FOR SELECT 
  USING (customer_id = auth.uid());

CREATE POLICY "Creators can view requests for their commissions" 
  ON public.commission_requests 
  FOR SELECT 
  USING (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can create requests" 
  ON public.commission_requests 
  FOR INSERT 
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Creators can update requests for their commissions" 
  ON public.commission_requests 
  FOR UPDATE 
  USING (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can update their own requests" 
  ON public.commission_requests 
  FOR UPDATE 
  USING (customer_id = auth.uid());

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_commission_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_commission_requests_updated_at
  BEFORE UPDATE ON public.commission_requests
  FOR EACH ROW EXECUTE FUNCTION update_commission_requests_updated_at();
