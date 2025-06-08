
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDeleteMessage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      console.log('useDeleteMessage: Starting deletion for message ID:', messageId);
      
      // First get the message to know both sender and receiver
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        console.error('useDeleteMessage: Error fetching message:', fetchError);
        throw fetchError;
      }

      // Mark message as deleted
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('useDeleteMessage: Database error:', error);
        throw error;
      }
      
      console.log('useDeleteMessage: Message marked as deleted in database');
      return { messageId, senderId: message.sender_id, receiverId: message.receiver_id };
    },
    onSuccess: ({ senderId, receiverId }) => {
      console.log('useDeleteMessage: Mutation succeeded, invalidating queries for both users');
      
      // Invalidate message queries for both sender and receiver
      queryClient.invalidateQueries({ queryKey: ['user-messages', senderId] });
      queryClient.invalidateQueries({ queryKey: ['user-messages', receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Force immediate refetch for both users
      queryClient.refetchQueries({ queryKey: ['user-messages', senderId] });
      queryClient.refetchQueries({ queryKey: ['user-messages', receiverId] });
      queryClient.refetchQueries({ queryKey: ['conversations'] });
      
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('useDeleteMessage: Mutation failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  });
}
