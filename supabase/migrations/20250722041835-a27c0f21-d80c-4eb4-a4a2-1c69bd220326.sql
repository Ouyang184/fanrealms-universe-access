-- Add tags column to posts table
ALTER TABLE public.posts 
ADD COLUMN tags text[] DEFAULT '{}';

-- Create GIN index for better performance on tag searches
CREATE INDEX idx_posts_tags ON public.posts USING GIN(tags);

-- Update existing posts to have empty tags array instead of null
UPDATE public.posts SET tags = '{}' WHERE tags IS NULL;