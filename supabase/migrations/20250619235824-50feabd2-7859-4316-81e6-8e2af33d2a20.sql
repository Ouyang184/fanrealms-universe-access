
-- Create a table to track post views
CREATE TABLE public.post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_type TEXT NOT NULL DEFAULT 'read', -- 'preview' or 'read'
  UNIQUE(post_id, user_id) -- Prevent duplicate views from same user
);

-- Add Row Level Security (RLS)
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Create policies for post views
CREATE POLICY "Users can view all post views" 
  ON public.post_views 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own post views" 
  ON public.post_views 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post views" 
  ON public.post_views 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.post_views 
ADD CONSTRAINT post_views_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Create an index for better performance
CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_user_id ON public.post_views(user_id);

-- Function to get view count for a post
CREATE OR REPLACE FUNCTION get_post_view_count(post_id_param UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER FROM public.post_views WHERE post_id = post_id_param;
$$;
