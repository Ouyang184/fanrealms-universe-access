
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Message } from "@/components/messaging/Message";
import { SendMessageDialog } from "@/components/messaging/SendMessageDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useCreators } from "@/hooks/useCreators";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface Conversation {
  id: string;
  username: string;
  profilePicture: string | null;
  lastMessage: string;
  lastMessageDate: string;
  isRead: boolean;
  userId: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<{id: string, username: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Get user's subscriptions to determine which creators they can message
  const { data: subscriptions = [] } = useSubscriptions();
  const { data: creators = [] } = useCreators();
  const subscribedCreatorIds = subscriptions.map(sub => sub.creator_id);

  // Filter creators based on subscription status and search term
  const filterCreators = creators.filter(creator => 
    subscribedCreatorIds.includes(creator.user_id) && 
    creator.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch conversations (both sent and received)
  const { data: conversations = [], isLoading, refetch } = useQuery({
    queryKey: ['user-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch messages where the user is either sender or receiver
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            username,
            profile_picture
          ),
          receiver:receiver_id (
            username,
            profile_picture
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          });
          console.error("Error loading messages:", error);
        }
        return [];
      }

      // Process the data to create conversation entries
      const conversationMap = new Map<string, Conversation>();
      
      messagesData?.forEach(message => {
        let conversationPartnerId, username, profilePicture;
        
        // Determine if the message is sent or received
        if (message.sender_id === user.id) {
          conversationPartnerId = message.receiver_id;
          username = message.receiver?.username;
          profilePicture = message.receiver?.profile_picture;
        } else {
          conversationPartnerId = message.sender_id;
          username = message.sender?.username;
          profilePicture = message.sender?.profile_picture;
        }
        
        // If this conversation isn't in the map yet or this message is newer
        if (!conversationMap.has(conversationPartnerId) || 
            new Date(message.created_at) > new Date(conversationMap.get(conversationPartnerId)!.lastMessageDate)) {
          conversationMap.set(conversationPartnerId, {
            id: message.id,
            username,
            profilePicture,
            lastMessage: message.message_text,
            lastMessageDate: message.created_at,
            isRead: message.is_read,
            userId: conversationPartnerId
          });
        }
      });
      
      // Convert the map to an array and sort by last message date (newest first)
      return Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
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

  // Handle selecting a creator to message
  const handleSelectCreator = (creator: {user_id: string, username?: string}) => {
    if (creator.username) {
      setSelectedCreator({
        id: creator.user_id,
        username: creator.username
      });
      setIsNewMessageDialogOpen(false);
    }
  };

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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Direct Messages</h1>
          <Button onClick={() => setIsNewMessageDialogOpen(true)}>
            New Message
          </Button>
        </div>

        <div className="space-y-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <div className="mb-4 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Start a conversation with a creator you're subscribed to
              </p>
              <Button onClick={() => setIsNewMessageDialogOpen(true)} className="mt-4">
                New Message
              </Button>
            </div>
          ) : (
            conversations.map((conversation) => (
              <Message
                key={conversation.id}
                senderName={conversation.username}
                messageText={conversation.lastMessage}
                createdAt={conversation.lastMessageDate}
                isRead={conversation.isRead}
                onClick={() => handleSelectCreator({ 
                  user_id: conversation.userId, 
                  username: conversation.username 
                })}
              />
            ))
          )}
        </div>

        {/* New Message Dialog */}
        <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search creators you're subscribed to..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filterCreators.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? 'No creators found' : 'Subscribe to creators to message them'}
                  </div>
                ) : (
                  filterCreators.map((creator) => (
                    <div 
                      key={creator.user_id}
                      className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => handleSelectCreator(creator)}
                    >
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden mr-3">
                        {creator.avatar_url ? (
                          <img src={creator.avatar_url} alt={creator.username} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                            {creator.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>{creator.username}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Message Dialog */}
        {selectedCreator && (
          <SendMessageDialog
            isOpen={!!selectedCreator}
            onClose={() => setSelectedCreator(null)}
            receiverId={selectedCreator.id}
            receiverName={selectedCreator.username}
          />
        )}
      </div>
    </MainLayout>
  );
}
