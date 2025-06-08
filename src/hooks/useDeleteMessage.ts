
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDeleteMessage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      console.log('useDeleteMessage: Starting deletion for message ID:', messageId);
      
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('useDeleteMessage: Database error:', error);
        throw error;
      }
      
      console.log('useDeleteMessage: Message marked as deleted in database');
      return messageId;
    },
    onSuccess: (messageId) => {
      console.log('useDeleteMessage: Mutation succeeded for message:', messageId);
      
      // Invalidate and refetch all message-related queries
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Force an immediate refetch to update the UI
      queryClient.refetchQueries({ queryKey: ['user-messages'] });
      
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
