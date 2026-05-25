-- Add missing increment_thread_view_count RPC.
-- ForumThread.tsx calls this on every page load to track views, but the
-- function didn't exist so view counts were always stuck at 0.

CREATE OR REPLACE FUNCTION public.increment_thread_view_count(thread_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.forum_threads
  SET view_count = view_count + 1
  WHERE id = thread_id;
$$;

-- Allow anyone (including anon) to call it — view tracking should work for all visitors
GRANT EXECUTE ON FUNCTION public.increment_thread_view_count(uuid) TO anon, authenticated;
