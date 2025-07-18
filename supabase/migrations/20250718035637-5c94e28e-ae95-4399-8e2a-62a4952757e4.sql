-- Create ratings table for creator reviews
CREATE TABLE public.creator_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  rating_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, creator_id, rating_type)
);

-- Enable RLS
ALTER TABLE public.creator_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for ratings
CREATE POLICY "Anyone can view ratings" 
ON public.creator_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create ratings if they have interaction" 
ON public.creator_ratings 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- User has active subscription with the creator
    EXISTS (
      SELECT 1 FROM user_subscriptions us 
      WHERE us.user_id = auth.uid() 
      AND us.creator_id = creator_ratings.creator_id 
      AND us.status = 'active'
    )
    OR
    -- User has made a commission request with the creator
    EXISTS (
      SELECT 1 FROM commission_requests cr 
      WHERE cr.customer_id = auth.uid() 
      AND cr.creator_id = creator_ratings.creator_id
    )
  )
);

CREATE POLICY "Users can update their own ratings" 
ON public.creator_ratings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON public.creator_ratings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_creator_ratings_updated_at
BEFORE UPDATE ON public.creator_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();