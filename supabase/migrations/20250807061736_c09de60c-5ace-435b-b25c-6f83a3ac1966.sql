-- Recreate the commission update notification trigger
CREATE OR REPLACE FUNCTION public.notify_customer_on_commission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  customer_username TEXT;
  creator_name TEXT;
  notification_content TEXT;
BEGIN
  -- Only create notifications for meaningful status changes and updates
  IF TG_OP = 'UPDATE' AND (
    OLD.status != NEW.status OR 
    OLD.creator_notes != NEW.creator_notes OR 
    OLD.agreed_price != NEW.agreed_price OR
    OLD.deadline != NEW.deadline
  ) THEN
    
    -- Get customer username
    SELECT username INTO customer_username 
    FROM public.users 
    WHERE id = NEW.customer_id;
    
    -- Get creator display name
    SELECT COALESCE(c.display_name, u.username) INTO creator_name
    FROM public.creators c
    JOIN public.users u ON u.id = c.user_id
    WHERE c.id = NEW.creator_id;
    
    -- Create appropriate notification content based on what changed
    IF OLD.status != NEW.status THEN
      notification_content := CONCAT(creator_name, ' updated your commission status to: ', NEW.status);
    ELSIF OLD.agreed_price != NEW.agreed_price THEN
      notification_content := CONCAT(creator_name, ' updated the agreed price for your commission');
    ELSIF OLD.deadline != NEW.deadline THEN
      notification_content := CONCAT(creator_name, ' updated the deadline for your commission');
    ELSIF OLD.creator_notes != NEW.creator_notes THEN
      notification_content := CONCAT(creator_name, ' added notes to your commission');
    ELSE
      notification_content := CONCAT(creator_name, ' updated your commission request');
    END IF;
    
    -- Insert notification for the customer
    INSERT INTO public.notifications (
      user_id,
      type,
      content,
      related_id,
      related_user_id,
      is_read,
      created_at,
      metadata
    )
    VALUES (
      NEW.customer_id,
      'commission',
      notification_content,
      NEW.id,
      (SELECT user_id FROM public.creators WHERE id = NEW.creator_id),
      false,
      NOW(),
      jsonb_build_object(
        'commission_request_id', NEW.id,
        'commission_title', NEW.title,
        'status_change', CASE WHEN OLD.status != NEW.status THEN 
          jsonb_build_object('from', OLD.status, 'to', NEW.status) 
        ELSE NULL END,
        'creator_id', NEW.creator_id,
        'creator_name', creator_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER commission_update_notification_trigger
    AFTER UPDATE ON public.commission_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_customer_on_commission_update();