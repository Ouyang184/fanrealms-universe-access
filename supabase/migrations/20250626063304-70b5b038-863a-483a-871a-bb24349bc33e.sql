
-- Add missing indexes for the remaining unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON public.post_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_post_tiers_tier_id ON public.post_tiers(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON public.user_subscriptions(tier_id);

-- Remove unused indexes that were created in the previous migration but are not being used
DROP INDEX IF EXISTS public.idx_conversation_participants_conversation_id;
DROP INDEX IF EXISTS public.idx_conversation_participants_other_user_id;
DROP INDEX IF EXISTS public.idx_feeds_user_id;
DROP INDEX IF EXISTS public.idx_follows_creator_id;
DROP INDEX IF EXISTS public.idx_membership_tiers_creator_id;
DROP INDEX IF EXISTS public.idx_messages_receiver_id;
DROP INDEX IF EXISTS public.idx_posts_creator_id;
DROP INDEX IF EXISTS public.idx_posts_tier_id;
DROP INDEX IF EXISTS public.idx_subscriptions_tier_id;
