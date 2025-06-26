
-- Fix the policy conflict by making the write policy only handle write operations

-- Drop the conflicting write policy
DROP POLICY IF EXISTS "Unified posts write access" ON public.posts;

-- Create separate policies for different write operations to avoid SELECT conflicts
CREATE POLICY "Unified posts insert access" ON public.posts
  FOR INSERT 
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Unified posts update access" ON public.posts
  FOR UPDATE 
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Unified posts delete access" ON public.posts
  FOR DELETE 
  USING ((SELECT auth.uid()) = author_id);
