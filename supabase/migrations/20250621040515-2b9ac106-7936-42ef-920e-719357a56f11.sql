
-- Create a table to track which posts users have read
CREATE TABLE public.post_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id) -- Prevent duplicate reads from same user
);

-- Add Row Level Security (RLS)
ALTER TABLE public.post_reads ENABLE ROW LEVEL SECURITY;

-- Create policies for post reads
CREATE POLICY "Users can view their own post reads" 
  ON public.post_reads 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own post reads" 
  ON public.post_reads 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post reads" 
  ON public.post_reads 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.post_reads 
ADD CONSTRAINT post_reads_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_post_reads_user_id ON public.post_reads(user_id);
CREATE INDEX idx_post_reads_post_id ON public.post_reads(post_id);
CREATE INDEX idx_post_reads_user_post ON public.post_reads(user_id, post_id);
