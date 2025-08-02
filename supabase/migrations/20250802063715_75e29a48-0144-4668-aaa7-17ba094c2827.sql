-- Create the trigger for commission request updates
CREATE TRIGGER commission_request_update_notification
  AFTER UPDATE ON public.commission_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_on_commission_update();