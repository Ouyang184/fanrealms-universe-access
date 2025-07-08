-- Drop the legacy subscriptions table completely
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Add unique constraint to user_subscriptions to prevent duplicate active subscriptions
-- This prevents the same user from having multiple active subscriptions to the same creator/tier
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_active_user_subscription 
ON public.user_subscriptions (user_id, creator_id, tier_id) 
WHERE status = 'active';

-- Add partial unique constraint for active subscriptions per creator (regardless of tier)
-- This ensures a user can only have one active subscription per creator at a time
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_active_user_creator_subscription 
ON public.user_subscriptions (user_id, creator_id) 
WHERE status = 'active';