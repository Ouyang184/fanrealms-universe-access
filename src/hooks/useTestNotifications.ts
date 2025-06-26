
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useTestNotifications = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createTestNotifications = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create test notifications.',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);

    try {
      const testNotifications = [
        {
          user_id: user.id,
          type: 'follow',
          content: 'TestUser started following you',
          metadata: {
            follower_username: 'TestUser'
          }
        },
        {
          user_id: user.id,
          type: 'like',
          title: 'New Like',
          content: 'Someone liked your post "My Amazing Content"',
          metadata: {
            post_title: 'My Amazing Content',
            liker_username: 'FanUser123'
          }
        },
        {
          user_id: user.id,
          type: 'comment',
          title: 'New Comment',
          content: 'CreativeFan commented on your post',
          metadata: {
            post_title: 'Behind the Scenes',
            commenter_username: 'CreativeFan'
          }
        }
      ];

      const { error } = await supabase
        .from('notifications')
        .insert(testNotifications as any);

      if (error) throw error;

      toast({
        title: 'Test notifications created',
        description: 'Check your notifications to see the test data.',
      });

    } catch (error) {
      console.error('Error creating test notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test notifications. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTestNotifications,
    isCreating
  };
};
