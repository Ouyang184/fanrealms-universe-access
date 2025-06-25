
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  type: 'mention' | 'like' | 'comment' | 'subscription' | 'system' | 'follow' | 'promotion';
  title?: string;
  content: string;
  related_id?: string;
  related_user_id?: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID found for notifications query');
        return [];
      }
      
      console.log('Fetching notifications for user:', user.id);
      
      // Use database-level filtering to exclude post and content notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .not('type', 'in', '(post,content)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log('Filtered notifications from database:', data);
      return data as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)
        .not('type', 'in', '(post,content)'); // Only mark non-content notifications as read

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({
        description: "Notification removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove notification",
        variant: "destructive",
      });
    }
  });

  // Auto-mark notifications as read when they are viewed
  const markAsReadOnView = async (notificationIds: string[]) => {
    if (notificationIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      }
    } catch (error) {
      console.error('Error auto-marking notifications as read:', error);
    }
  };

  // Count unread notifications by type - excluding post and content types
  const unreadCounts = {
    all: notifications.filter((n) => !n.is_read).length,
    mentions: notifications.filter((n) => n.type === "mention" && !n.is_read).length,
    comments: notifications.filter((n) => n.type === "comment" && !n.is_read).length,
    likes: notifications.filter((n) => n.type === "like" && !n.is_read).length,
    content: 0, // Always 0 since we're filtering out content notifications
    system: notifications.filter(
      (n) => (n.type === "system" || n.type === "subscription" || n.type === "promotion") && !n.is_read,
    ).length,
    follow: notifications.filter((n) => n.type === "follow" && !n.is_read).length,
  };

  return {
    notifications,
    isLoading,
    error,
    unreadCounts,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    markAsReadOnView,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
};
