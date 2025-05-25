
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useTestNotifications = () => {
  const { user } = useAuth();

  const createTestNotifications = async () => {
    if (!user) return;

    const testNotifications = [
      {
        user_id: user.id,
        type: 'follow',
        content: 'Someone started following you',
        metadata: { follower_username: 'test_user' }
      },
      {
        user_id: user.id,
        type: 'system',
        title: 'Welcome!',
        content: 'Welcome to the platform! Start following creators to see their content.',
        metadata: {}
      },
      {
        user_id: user.id,
        type: 'content',
        content: 'A creator you follow posted new content',
        metadata: { post_title: 'Amazing new artwork!' }
      }
    ];

    try {
      const { error } = await supabase
        .from('notifications')
        .insert(testNotifications);

      if (error) {
        console.error('Error creating test notifications:', error);
      } else {
        console.log('Test notifications created successfully');
      }
    } catch (error) {
      console.error('Error in createTestNotifications:', error);
    }
  };

  return { createTestNotifications };
};
