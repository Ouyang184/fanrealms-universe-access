
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useNotificationActions = () => {
  const { user } = useAuth();

  const createFollowNotification = async (creatorId: string, creatorUserId: string) => {
    if (!user) return;

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

      const creatorName = creator?.display_name || creator?.users?.username || 'A creator';

      // Create notification for the creator being followed
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: creatorUserId,
          type: 'follow',
          content: `${user.email?.split('@')[0] || 'Someone'} started following you`,
          related_id: creatorId,
          related_user_id: user.id,
          metadata: {
            follower_username: user.email?.split('@')[0] || 'Someone',
            creator_name: creatorName
          }
        });

      if (error) {
        console.error('Error creating follow notification:', error);
      } else {
        console.log('Follow notification created successfully');
      }
    } catch (error) {
      console.error('Error in createFollowNotification:', error);
    }
  };

  return {
    createFollowNotification
  };
};
