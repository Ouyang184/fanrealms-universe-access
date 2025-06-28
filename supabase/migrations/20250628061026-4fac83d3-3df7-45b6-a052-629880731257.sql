
-- Optimize RLS policies to improve performance by using (select auth.uid()) instead of auth.uid()
-- This prevents re-evaluation of auth functions for each row

-- Drop and recreate optimized policies for posts table
DROP POLICY IF EXISTS "Users can create posts as creators" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Users can create posts as creators" ON public.posts
  FOR INSERT WITH CHECK (
    (select auth.uid()) = author_id AND 
    EXISTS (SELECT 1 FROM creators WHERE user_id = (select auth.uid()) AND id = creator_id)
  );

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING ((select auth.uid()) = author_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING ((select auth.uid()) = author_id);

-- Drop and recreate optimized policies for creators table
DROP POLICY IF EXISTS "Users can update their own creator profile" ON public.creators;
DROP POLICY IF EXISTS "Users can create their own creator profile" ON public.creators;

CREATE POLICY "Users can update their own creator profile" ON public.creators
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own creator profile" ON public.creators
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate optimized policies for comments table
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Drop and recreate optimized policies for likes table
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

CREATE POLICY "Authenticated users can create likes" ON public.likes
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Drop and recreate optimized policies for follows table
DROP POLICY IF EXISTS "Authenticated users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

CREATE POLICY "Authenticated users can create follows" ON public.follows
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Drop and recreate optimized policy for users table
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING ((select auth.uid()) = id);
