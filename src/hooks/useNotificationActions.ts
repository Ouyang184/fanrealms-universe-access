
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useNotificationActions = () => {
  const { user } = useAuth();

  const createFollowNotification = async (creatorId: string, creatorUserId: string) => {
    if (!user) {
      console.log("No user found, cannot create notification");
      return;
    }

    console.log("Creating follow notification for:", { creatorId, creatorUserId, followerUserId: user.id });

    try {
      // Get follower info for the notification
      const { data: followerUser, error: followerError } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      if (followerError) {
        console.error('Error fetching follower info:', followerError);
        // Continue with email fallback
      }

      const followerName = followerUser?.username || user.email?.split('@')[0] || 'Someone';

      console.log("Creating notification with follower name:", followerName);

      // Create notification for the creator being followed
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: creatorUserId,
          type: 'follow',
          content: `${followerName} started following you`,
          related_id: creatorId,
          related_user_id: user.id,
          is_read: false,
          metadata: {
            follower_username: followerName,
            creator_id: creatorId
          }
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating follow notification:', error);
        // Don't throw error to avoid breaking the follow flow
        return null;
      } else {
        console.log('Follow notification created successfully:', data);
        return data;
      }
    } catch (error) {
      console.error('Error in createFollowNotification:', error);
      // Don't throw error to avoid breaking the follow flow
      return null;
    }
  };

  return {
    createFollowNotification
  };
};
