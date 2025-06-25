
-- Create post_shares table to track share analytics
CREATE TABLE public.post_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert shares (since sharing can be anonymous)
CREATE POLICY "Anyone can record shares" 
  ON public.post_shares 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow post authors and share creators to view shares
CREATE POLICY "Users can view shares of their posts or their own shares" 
  ON public.post_shares 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_shares.post_id 
      AND posts.author_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX idx_post_shares_post_id ON public.post_shares(post_id);
CREATE INDEX idx_post_shares_platform ON public.post_shares(platform);
