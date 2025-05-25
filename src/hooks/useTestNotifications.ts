
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useTestNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const createTestNotifications = async () => {
    if (!user) {
      console.log("No user found, cannot create test notifications");
      toast({
        title: "Error",
        description: "You must be logged in to create test notifications",
        variant: "destructive",
      });
      return;
    }

    console.log("Creating test notifications for user:", user.id);

    const testNotifications = [
      {
        user_id: user.id,
        type: 'follow',
        content: 'TestUser started following you',
        metadata: { follower_username: 'TestUser' }
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
      const { data, error } = await supabase
        .from('notifications')
        .insert(testNotifications)
        .select('*');

      if (error) {
        console.error('Error creating test notifications:', error);
        toast({
          title: "Error",
          description: "Failed to create test notifications",
          variant: "destructive",
        });
      } else {
        console.log('Test notifications created successfully:', data);
        toast({
          description: `Created ${data.length} test notifications`,
        });
      }
    } catch (error) {
      console.error('Error in createTestNotifications:', error);
      toast({
        title: "Error",
        description: "Failed to create test notifications",
        variant: "destructive",
      });
    }
  };

  return { createTestNotifications };
};
