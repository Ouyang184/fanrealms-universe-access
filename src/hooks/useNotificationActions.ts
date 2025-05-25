
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
      // Get creator info for the notification
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('display_name, users(username)')
        .eq('id', creatorId)
        .single();

      if (creatorError) {
        console.error('Error fetching creator for notification:', creatorError);
        return;
      }

      console.log("Creator info for notification:", creator);

      const creatorName = creator?.display_name || creator?.users?.username || 'A creator';
      const followerName = user.email?.split('@')[0] || 'Someone';

      console.log("Creating notification with:", { creatorName, followerName });

      // Create notification for the creator being followed
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: creatorUserId,
          type: 'follow',
          content: `${followerName} started following you`,
          related_id: creatorId,
          related_user_id: user.id,
          metadata: {
            follower_username: followerName,
            creator_name: creatorName
          }
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating follow notification:', error);
      } else {
        console.log('Follow notification created successfully:', data);
      }
    } catch (error) {
      console.error('Error in createFollowNotification:', error);
    }
  };

  return {
    createFollowNotification
  };
};
