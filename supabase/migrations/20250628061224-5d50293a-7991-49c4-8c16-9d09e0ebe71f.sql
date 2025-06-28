
-- Clean up duplicate and overlapping RLS policies to improve performance
-- Remove redundant policies that serve the same purpose

-- Clean up posts table - remove redundant unified policies
DROP POLICY IF EXISTS "Unified posts read access" ON public.posts;
DROP POLICY IF EXISTS "Unified posts insert access" ON public.posts;
DROP POLICY IF EXISTS "Unified posts update access" ON public.posts;
DROP POLICY IF EXISTS "Unified posts delete access" ON public.posts;

-- Clean up creators table - remove redundant policies
DROP POLICY IF EXISTS "Creators can view all creators" ON public.creators;
DROP POLICY IF EXISTS "Users can insert their own creator profile" ON public.creators;

-- Clean up comments table - remove redundant policies
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can read comments on posts" ON public.comments;

-- Clean up likes table - remove redundant policies
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;

-- Clean up follows table - remove redundant policies
DROP POLICY IF EXISTS "Users can create their own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;

-- Clean up users table - remove redundant policies
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
