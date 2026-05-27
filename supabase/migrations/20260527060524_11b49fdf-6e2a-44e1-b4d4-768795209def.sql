CREATE OR REPLACE FUNCTION public.insert_message(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_message_text TEXT,
  p_is_read BOOLEAN
) RETURNS json AS $$
BEGIN
  IF auth.uid() IS NULL OR p_sender_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden: sender_id must match the authenticated user';
  END IF;

  INSERT INTO public.messages (
    sender_id,
    receiver_id,
    message_text,
    is_read
  ) VALUES (
    p_sender_id,
    p_receiver_id,
    p_message_text,
    p_is_read
  );

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE;
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;