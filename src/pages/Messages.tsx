
import { MainLayout } from "@/components/main-layout";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessagesList } from '@/components/messaging/MessagesList';
import { EmptyMessages } from '@/components/messaging/EmptyMessages';
import { CreatorChatModal } from '@/components/messaging/CreatorChatModal';
import { SendMessageDialog } from '@/components/messaging/SendMessageDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          creator_id,
          user_id,
          last_message_at,
          creator:creator_profiles!conversations_creator_id_fkey (
            id,
            creator_name,
            profile_picture,
            user_id
          ),
          user:profiles!conversations_user_id_fkey (
            id,
            username,
            profile_picture
          )
        `)
        .or(`creator_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewMessage = () => {
    setShowNewMessageDialog(true);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

  const handleMessageSent = () => {
    fetchConversations();
    setShowNewMessageDialog(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading conversations...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Chat with creators and subscribers</p>
          </div>
          <Button onClick={handleNewMessage} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Message
          </Button>
        </div>

        {conversations.length === 0 ? (
          <EmptyMessages onNewMessage={handleNewMessage} />
        ) : (
          <MessagesList 
            conversations={conversations}
            onConversationSelect={handleConversationSelect}
            onRefresh={fetchConversations}
          />
        )}

        {selectedConversation && (
          <CreatorChatModal
            conversation={selectedConversation}
            isOpen={!!selectedConversation}
            onClose={handleCloseChat}
            onMessageSent={handleMessageSent}
          />
        )}

        <SendMessageDialog
          isOpen={showNewMessageDialog}
          onClose={() => setShowNewMessageDialog(false)}
          onMessageSent={handleMessageSent}
        />
      </div>
    </MainLayout>
  );
}
