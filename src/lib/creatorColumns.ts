// Explicit SELECT column list for public.creators.
//
// `select('*')` on creators FAILS for the anon/authenticated roles with
// "permission denied for table creators", because three columns have no
// SELECT grant by design: platform_fee_rate, payout_method, payout_details
// (the last is a PayPal email and must never be world-readable, since RLS
// lets anyone read creator rows). A `*` expansion hits those columns and the
// whole query is rejected, which silently nulls out the creator profile.
//
// Use this constant instead of '*' anywhere we read creator profile rows.
// It is exactly the set of columns the roles are allowed to read, so it
// returns what a working `select('*')` would have, and never leaks payout data.
export const CREATOR_SAFE_COLUMNS =
  'id, user_id, username, display_name, creator_name, bio, tags, website, ' +
  'banner_url, profile_image_url, user_profile_picture, follower_count, is_nsfw, ' +
  'accepts_commissions, commission_base_rate, commission_turnaround_days, ' +
  'commission_slots_available, commission_tos, created_at, updated_at';
