
-- Fix the most critical RLS performance issues

-- First, drop duplicate/overlapping policies on posts table
DROP POLICY IF EXISTS "Users can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Creators can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Creators can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Creators can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Creators can delete their own posts" ON public.posts;

-- Create optimized, consolidated policies for posts
CREATE POLICY "Optimized posts read access" ON public.posts
  FOR SELECT USING (
    -- Public posts OR user owns post OR user has tier access
    tier_id IS NULL 
    OR (SELECT auth.uid()) = author_id 
    OR public.user_has_tier_access(tier_id)
    OR EXISTS (
      SELECT 1 FROM public.post_tiers pt
      WHERE pt.post_id = posts.id
      AND public.user_has_tier_access(pt.tier_id)
    )
  );

CREATE POLICY "Optimized posts write access" ON public.posts
  FOR ALL USING ((SELECT auth.uid()) = author_id);

-- Fix post_reads policies
DROP POLICY IF EXISTS "Users can view their own post reads" ON public.post_reads;
DROP POLICY IF EXISTS "Users can create their own post reads" ON public.post_reads;
DROP POLICY IF EXISTS "Users can update their own post reads" ON public.post_reads;

CREATE POLICY "Optimized post reads access" ON public.post_reads
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix post_shares policies  
DROP POLICY IF EXISTS "Users can view shares of their posts or their own shares" ON public.post_shares;

CREATE POLICY "Optimized post shares access" ON public.post_shares
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id 
    OR EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_shares.post_id 
      AND p.author_id = (SELECT auth.uid())
    )
  );

-- Fix post_views policies
DROP POLICY IF EXISTS "Users can create their own post views" ON public.post_views;
DROP POLICY IF EXISTS "Users can update their own post views" ON public.post_views;

CREATE POLICY "Optimized post views access" ON public.post_views
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix messages policies
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

CREATE POLICY "Optimized messages access" ON public.messages
  FOR ALL USING (
    (SELECT auth.uid()) = sender_id 
    OR (SELECT auth.uid()) = receiver_id
  );

-- Clean up post_tiers duplicate policies
DROP POLICY IF EXISTS "Users can manage their post tiers" ON public.post_tiers;
DROP POLICY IF EXISTS "Users can view post tiers they have access to" ON public.post_tiers;

CREATE POLICY "Optimized post tiers access" ON public.post_tiers
  FOR SELECT USING (
    public.user_owns_post(post_id)
    OR public.user_has_tier_access(tier_id)
  );

CREATE POLICY "Optimized post tiers management" ON public.post_tiers
  FOR ALL USING (public.user_owns_post(post_id));
