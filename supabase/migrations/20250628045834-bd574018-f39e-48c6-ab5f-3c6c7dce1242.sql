
-- Revert the database optimizations from the last 2 migrations
-- This will restore the original RLS policies and indexes

-- Restore original RLS policies that use auth.uid() directly instead of (select auth.uid())

-- Drop the optimized policies and restore originals for posts table
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts as creators" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts as creators" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND 
    EXISTS (SELECT 1 FROM creators WHERE user_id = auth.uid() AND id = creator_id)
  );

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Restore original RLS policies for creators table
DROP POLICY IF EXISTS "Anyone can view creators" ON public.creators;
DROP POLICY IF EXISTS "Users can update their own creator profile" ON public.creators;
DROP POLICY IF EXISTS "Users can create their own creator profile" ON public.creators;

CREATE POLICY "Anyone can view creators" ON public.creators
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own creator profile" ON public.creators
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own creator profile" ON public.creators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Restore original RLS policies for comments table
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Restore original RLS policies for likes table
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Restore original RLS policies for follows table
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Authenticated users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

CREATE POLICY "Anyone can view follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE USING (auth.uid() = user_id);

-- Restore original RLS policies for users table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Restore any indexes that may have been removed
-- (Re-create the duplicate index that was removed)
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
