
-- Add missing indexes for foreign keys to improve query performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_other_user_id ON public.conversation_participants(other_user_id);
CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON public.feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_creator_id ON public.follows(creator_id);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_creator_id ON public.membership_tiers(creator_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_tier_id ON public.posts(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_id ON public.subscriptions(tier_id);

-- Remove unused indexes to improve write performance and reduce storage
DROP INDEX IF EXISTS public.comments_user_id_idx;
DROP INDEX IF EXISTS public.idx_post_shares_user_id;
DROP INDEX IF EXISTS public.idx_post_tiers_tier_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_tier_id;
