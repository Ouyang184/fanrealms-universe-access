
-- Create a function to insert messages
CREATE OR REPLACE FUNCTION public.insert_message(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_message_text TEXT,
  p_is_read BOOLEAN
) RETURNS json AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
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
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
