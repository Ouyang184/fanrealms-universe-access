
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDeleteMessage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      console.log('useDeleteMessage: Deleting message with ID:', messageId);
      
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('useDeleteMessage: Database error:', error);
        throw error;
      }
      
      console.log('useDeleteMessage: Message deleted successfully in database');
    },
    onSuccess: (_, messageId) => {
      console.log('useDeleteMessage: Mutation succeeded, invalidating queries');
      
      // Invalidate and refetch queries immediately
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Force refetch to ensure UI updates immediately
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
