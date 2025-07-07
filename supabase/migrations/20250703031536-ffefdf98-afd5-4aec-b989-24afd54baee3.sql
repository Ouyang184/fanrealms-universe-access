
-- Create commission_deliverables table
CREATE TABLE public.commission_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_request_id UUID NOT NULL REFERENCES public.commission_requests(id) ON DELETE CASCADE,
  file_urls TEXT[] NOT NULL DEFAULT '{}',
  delivery_notes TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_deliverables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Creators can view deliverables for their commissions" 
  ON public.commission_deliverables 
  FOR SELECT 
  USING (commission_request_id IN (
    SELECT id FROM public.commission_requests 
    WHERE creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Customers can view deliverables for their requests" 
  ON public.commission_deliverables 
  FOR SELECT 
  USING (commission_request_id IN (
    SELECT id FROM public.commission_requests 
    WHERE customer_id = auth.uid()
  ));

CREATE POLICY "Creators can create deliverables for their commissions" 
  ON public.commission_deliverables 
  FOR INSERT 
  WITH CHECK (commission_request_id IN (
    SELECT id FROM public.commission_requests 
    WHERE creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Creators can update deliverables for their commissions" 
  ON public.commission_deliverables 
  FOR UPDATE 
  USING (commission_request_id IN (
    SELECT id FROM public.commission_requests 
    WHERE creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  ));

-- Create storage bucket for commission deliverables
INSERT INTO storage.buckets (id, name, public) 
VALUES ('commission-deliverables', 'commission-deliverables', false);

-- Create storage policies
CREATE POLICY "Creators can upload deliverables" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'commission-deliverables' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Creators and customers can view deliverables" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'commission-deliverables' AND (
      -- Creator can see their own uploads
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Customer can see deliverables for their requests
      EXISTS (
        SELECT 1 FROM public.commission_requests cr
        JOIN public.commission_deliverables cd ON cd.commission_request_id = cr.id
        WHERE cr.customer_id = auth.uid()
        AND (storage.foldername(name))[2] = cr.id::text
      )
    )
  );

-- Add new statuses to commission_requests
ALTER TABLE public.commission_requests 
DROP CONSTRAINT IF EXISTS commission_requests_status_check;

ALTER TABLE public.commission_requests 
ADD CONSTRAINT commission_requests_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'delivered', 'under_review', 'revision_requested', 'cancelled'));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_commission_deliverables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_commission_deliverables_updated_at
  BEFORE UPDATE ON public.commission_deliverables
  FOR EACH ROW EXECUTE FUNCTION update_commission_deliverables_updated_at();
