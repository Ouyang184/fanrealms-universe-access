
-- Rollback migration: Remove the indexes that were added and restore the ones that were dropped

-- Remove the indexes that were added in the previous migration
DROP INDEX IF EXISTS public.idx_conversation_participants_conversation_id;
DROP INDEX IF EXISTS public.idx_conversation_participants_other_user_id;
DROP INDEX IF EXISTS public.idx_feeds_user_id;
DROP INDEX IF EXISTS public.idx_follows_creator_id;
DROP INDEX IF EXISTS public.idx_membership_tiers_creator_id;
DROP INDEX IF EXISTS public.idx_messages_receiver_id;
DROP INDEX IF EXISTS public.idx_posts_creator_id;
DROP INDEX IF EXISTS public.idx_posts_tier_id;
DROP INDEX IF EXISTS public.idx_subscriptions_tier_id;

-- Restore the indexes that were dropped in the previous migration
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON public.post_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_post_tiers_tier_id ON public.post_tiers(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON public.user_subscriptions(tier_id);
