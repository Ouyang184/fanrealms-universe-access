
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Message } from "@/components/messaging/Message";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MessageData {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  sender: {
    username: string;
    profile_picture: string | null;
  };
}

export default function CreatorMessages() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['creator-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Use direct API call with custom types
      const { data, error } = await supabase.rest.from<MessageData>('messages')
        .select(`
          *,
          sender:sender_id (
            username,
            profile_picture
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`messages-${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}` 
        }, 
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Messages</h1>
        
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No messages yet
            </p>
          ) : (
            messages.map((message: MessageData) => (
              <Message
                key={message.id}
                senderName={message.sender.username}
                messageText={message.message_text}
                createdAt={message.created_at}
                isRead={message.is_read}
              />
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
