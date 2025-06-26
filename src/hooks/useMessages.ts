
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
  deleted_at: string | null;
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

      console.log('useMessages: Fetching messages for user:', userId);

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

      console.log('useMessages: Fetched messages count:', messagesData?.length || 0);

      const userIds = new Set<string>();
      (messagesData as any)?.forEach((message: any) => {
        userIds.add(message.sender_id);
        userIds.add(message.receiver_id);
      });

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, profile_picture')
        .in('id', Array.from(userIds) as any);

      if (usersError) {
        console.error("Error loading users:", usersError);
        return [];
      }

      const userMap = new Map();
      (usersData as any)?.forEach((user: any) => {
        userMap.set(user.id, user);
      });

      return (messagesData as any)?.map((message: any) => {
        const senderData = userMap.get(message.sender_id);
        const receiverData = userMap.get(message.receiver_id);
        return {
          ...(message as any),
          sender_username: senderData?.username || "Unknown User",
          sender_profile_picture: senderData?.profile_picture,
          receiver_username: receiverData?.username || "Unknown User",
          receiver_profile_picture: receiverData?.profile_picture,
        };
      }) || [];
    },
    enabled: !!userId,
    staleTime: 300000, // 5 minutes - much longer to reduce queries
    refetchInterval: false, // COMPLETELY DISABLE auto-refetch
  });

  const markMessagesAsReadMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true } as any)
        .eq('receiver_id', user.id as any)
        .eq('sender_id', otherUserId as any)
        .eq('is_read', false as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error marking messages as read:', error);
    }
  });

  // COMPLETELY REMOVED all realtime subscriptions - they were causing 7.4M queries
  console.log('useMessages: All realtime subscriptions DISABLED for performance');

  return { 
    messages, 
    isLoading, 
    markMessagesAsRead: markMessagesAsReadMutation.mutate,
    isMarkingAsRead: markMessagesAsReadMutation.isPending
  };
}

export type { MessageData };
