
import { createJsonResponse } from '../utils/cors.ts';

export async function handleGetUserSubscriptions(
  supabaseService: any,
  user: any,
  userId?: string
) {
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) {
    return createJsonResponse({ error: 'User ID required' }, 400);
  }

  console.log('Getting user subscriptions for user:', targetUserId);

  try {
    // Get all active subscriptions from user_subscriptions table
    const { data: userSubscriptions, error: userSubsError } = await supabaseService
      .from('user_subscriptions')
      .select(`
        *,
        creator:creators (
          id,
          display_name,
          profile_image_url,
          users (
            username
          )
        ),
        tier:membership_tiers (
          id,
          title,
          description,
          price
        )
      `)
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (userSubsError) {
      console.error('Error fetching user subscriptions:', userSubsError);
      throw userSubsError;
    }

    console.log('Active subscriptions found:', userSubscriptions?.length || 0);

    return createJsonResponse({
      subscriptions: userSubscriptions || [],
      userId: targetUserId
    });

  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return createJsonResponse({ error: 'Failed to get user subscriptions' }, 500);
  }
}
