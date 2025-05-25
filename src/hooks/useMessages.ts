
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageData {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  sender_username?: string;
  sender_profile_picture?: string;
  receiver_username?: string;
  receiver_profile_picture?: string;
}

export function useMessages(userId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['user-messages', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Fetch messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== 'PGRST116') {
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          });
          console.error("Error loading messages:", error);
        }
        return [];
      }

      // Get unique user IDs
      const userIds = new Set<string>();
      messagesData?.forEach(message => {
        userIds.add(message.sender_id);
        userIds.add(message.receiver_id);
      });

      // Fetch user data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, profile_picture')
        .in('id', Array.from(userIds));

      if (usersError) {
        console.error("Error loading users:", usersError);
        return [];
      }

      // Create user lookup map
      const userMap = new Map();
      usersData?.forEach(user => {
        userMap.set(user.id, user);
      });

      // Combine message and user data
      return messagesData?.map(message => {
        const senderData = userMap.get(message.sender_id);
        const receiverData = userMap.get(message.receiver_id);
        return {
          ...message,
          sender_username: senderData?.username || "Unknown User",
          sender_profile_picture: senderData?.profile_picture,
          receiver_username: receiverData?.username || "Unknown User",
          receiver_profile_picture: receiverData?.profile_picture,
        };
      }) || [];
    },
    enabled: !!userId,
  });

  // Mark messages as read mutation
  const markMessagesAsReadMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Mark all unread messages from the other user as read
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error marking messages as read:', error);
    }
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${userId}` 
        }, 
        () => {
          refetch();
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${userId}` 
        }, 
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  return { 
    messages, 
    isLoading, 
    markMessagesAsRead: markMessagesAsReadMutation.mutate,
    isMarkingAsRead: markMessagesAsReadMutation.isPending
  };
}

export type { MessageData };
