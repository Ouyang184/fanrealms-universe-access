CREATE OR REPLACE FUNCTION public.update_thread_reply_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_threads SET reply_count = reply_count + 1, updated_at = now() WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_threads SET reply_count = GREATEST(reply_count - 1, 0), updated_at = now() WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;