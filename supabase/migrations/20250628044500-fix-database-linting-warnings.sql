
-- Fix database linting warnings for performance optimization

-- 1. Fix RLS policies to use (select auth.uid()) instead of auth.uid() for better performance
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can select own record" ON public.users;

-- Create optimized RLS policies with proper auth function calls
CREATE POLICY "Users can insert their own record" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
TO authenticated
USING ((select auth.uid()) = id);

-- 2. Remove duplicate index on comments table
-- Keep idx_comments_user_id and drop the duplicate
DROP INDEX IF EXISTS comments_user_id_idx;

-- 3. Ensure we have proper indexes for performance
-- These were created in the fix_supabase_warnings.sql but let's make sure they exist
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_creator_id ON public.follows(creator_id);
CREATE INDEX IF NOT EXISTS idx_follows_user_id ON public.follows(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON public.creators(user_id);

-- 4. Add any missing RLS policies that might be needed
-- Ensure all tables have proper RLS policies without performance issues

-- Update posts policies to use optimized auth calls
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

-- Update creators policies
DROP POLICY IF EXISTS "Users can update their own creator profile" ON public.creators;
DROP POLICY IF EXISTS "Users can create their own creator profile" ON public.creators;

CREATE POLICY "Users can update their own creator profile" ON public.creators
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own creator profile" ON public.creators
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Update other policies that might have performance issues
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Update likes policies
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

CREATE POLICY "Authenticated users can create likes" ON public.likes
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Update follows policies
DROP POLICY IF EXISTS "Authenticated users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

CREATE POLICY "Authenticated users can create follows" ON public.follows
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE USING ((select auth.uid()) = user_id);
