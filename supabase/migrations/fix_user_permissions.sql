
-- Ensure regular users can comment on posts
-- The existing policy should work, but let's make it explicit

-- Drop existing comment policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;

-- Recreate comment policies to be more explicit
CREATE POLICY "Anyone can view comments" 
ON public.comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Ensure regular users can follow creators
-- The existing policy should work, but let's make it explicit

-- Drop existing follow policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

-- Recreate follow policies to be more explicit
CREATE POLICY "Anyone can view follows" 
ON public.follows 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own follows" 
ON public.follows 
FOR DELETE 
USING (auth.uid() = user_id);
