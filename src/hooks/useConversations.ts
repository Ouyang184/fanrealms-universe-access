
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ConversationParticipant {
  id: string;
  user_id: string;
  other_user_id: string;
  last_message_at: string;
  other_user: {
    id: string;
    username: string;
    email: string;
    profile_picture?: string;
  } | null;
  creator_profile?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    bio?: string;
  } | null;
  last_message?: {
    id: string;
    message_text: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  } | null;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, refetch } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get conversation participants
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          other_user:users!conversation_participants_other_user_id_fkey(
            id,
            username,
            email,
            profile_picture
          )
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (participantsError) {
        console.error('Error fetching conversation participants:', participantsError);
        throw participantsError;
      }

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get creator profiles for participants who are creators
      const otherUserIds = participants.map(p => p.other_user_id);
      const { data: creatorProfiles } = await supabase
        .from('creators')
        .select('id, user_id, display_name, profile_image_url, bio')
        .in('user_id', otherUserIds);

      // Get last messages for each conversation
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .in('sender_id', otherUserIds.concat(user.id))
        .in('receiver_id', otherUserIds.concat(user.id))
        .order('created_at', { ascending: false });

      // Get unread message counts
      const { data: unreadCounts } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      // Build the conversation data
      const conversationData: ConversationParticipant[] = participants.map(participant => {
        const creatorProfile = creatorProfiles?.find(cp => cp.user_id === participant.other_user_id);
        
        // Find the most recent message between these two users
        const lastMessage = lastMessages?.find(msg => 
          (msg.sender_id === user.id && msg.receiver_id === participant.other_user_id) ||
          (msg.sender_id === participant.other_user_id && msg.receiver_id === user.id)
        );

        // Count unread messages from this specific user
        const unreadCount = unreadCounts?.filter(msg => 
          msg.sender_id === participant.other_user_id
        ).length || 0;

        return {
          ...participant,
          creator_profile: creatorProfile,
          last_message: lastMessage,
          unread_count: unreadCount
        };
      });

      return conversationData;
    },
    enabled: !!user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, messageText }: { receiverId: string; messageText: string }) => {
      if (!user?.id) throw new Error('Must be logged in to send messages');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message_text: messageText,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    conversations,
    isLoading,
    refetch,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
  };
}
