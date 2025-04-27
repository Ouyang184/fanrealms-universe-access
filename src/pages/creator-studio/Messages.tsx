
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
  sender_username?: string;
  sender_profile_picture?: string;
}

export default function CreatorMessages() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['creator-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch messages where the creator is the receiver
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Only show toast for actual server errors, not empty results
        if (error.code !== 'PGRST116') {  // PGRST116 is "No rows returned" which isn't a real error
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          });
          console.error("Error loading messages:", error);
          return [];
        }
      }

      // Now fetch user data for senders
      const senderIds = new Set<string>();
      messagesData?.forEach(message => {
        senderIds.add(message.sender_id);
      });

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, profile_picture')
        .in('id', Array.from(senderIds));

      if (usersError) {
        console.error("Error loading users:", usersError);
        return [];
      }

      // Map user data to messages
      const userMap = new Map();
      usersData?.forEach(user => {
        userMap.set(user.id, user);
      });

      // Combine message data with sender info
      return messagesData?.map(message => {
        const senderData = userMap.get(message.sender_id);
        return {
          ...message,
          sender_username: senderData?.username || "Unknown User",
          sender_profile_picture: senderData?.profile_picture
        };
      }) || [];
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
      <MainLayout hideTopBar>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout hideTopBar>
      <div className="space-y-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <div className="mb-4 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Messages from your fans will appear here
              </p>
            </div>
          ) : (
            messages.map((message: MessageData) => (
              <Message
                key={message.id}
                senderName={message.sender_username || "Unknown User"}
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
