-- Create revisions table to track revision requests
CREATE TABLE public.commission_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_request_id UUID NOT NULL,
  requester_id UUID NOT NULL,
  revision_number INTEGER NOT NULL,
  request_notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_extra_revision BOOLEAN NOT NULL DEFAULT false,
  extra_revision_fee NUMERIC,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add revision count to commission_requests
ALTER TABLE public.commission_requests 
ADD COLUMN revision_count INTEGER NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.commission_revisions ENABLE ROW LEVEL SECURITY;

-- Create policies for revisions
CREATE POLICY "Users can view revisions for their commissions" 
ON public.commission_revisions 
FOR SELECT 
USING (
  commission_request_id IN (
    SELECT id FROM commission_requests 
    WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    ) OR customer_id = auth.uid()
  )
);

CREATE POLICY "Customers can create revision requests" 
ON public.commission_revisions 
FOR INSERT 
WITH CHECK (
  auth.uid() = requester_id AND
  commission_request_id IN (
    SELECT id FROM commission_requests 
    WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Users can update revisions for their commissions" 
ON public.commission_revisions 
FOR UPDATE 
USING (
  commission_request_id IN (
    SELECT id FROM commission_requests 
    WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    ) OR customer_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_commission_revisions_updated_at
BEFORE UPDATE ON public.commission_revisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();