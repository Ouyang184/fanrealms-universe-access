
-- Add scheduling fields to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('published', 'scheduled', 'draft'));

-- Create index for efficient querying of scheduled posts
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON public.posts(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
