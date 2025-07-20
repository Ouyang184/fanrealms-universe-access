
-- Add foreign key constraints to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT fk_user_subscriptions_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT fk_user_subscriptions_tier_id 
FOREIGN KEY (tier_id) REFERENCES public.membership_tiers(id) ON DELETE CASCADE;

ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT fk_user_subscriptions_creator_id 
FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;
