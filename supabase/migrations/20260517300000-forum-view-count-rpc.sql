-- Atomic RPC to increment forum thread view count on each page visit.
-- SECURITY DEFINER so any authenticated or anon visitor can trigger it
-- without needing UPDATE permission on forum_threads.

CREATE OR REPLACE FUNCTION public.increment_thread_view_count(thread_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.forum_threads
  SET view_count = view_count + 1
  WHERE id = thread_id
    AND status = 'published';
$$;
