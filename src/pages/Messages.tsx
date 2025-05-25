
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Send, Paperclip, Check, CheckCheck, Star } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useDeleteMessage } from "@/hooks/useDeleteMessage";
import { DeleteMessageDialog } from "@/components/messaging/DeleteMessageDialog";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversations, isLoading: conversationsLoading, sendMessage, isSendingMessage } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMessageMutation = useDeleteMessage();

  const { 
    messages, 
    isLoading: messagesLoading,
    markMessagesAsRead,
    isMarkingAsRead
  } = useMessages(selectedConversation);

  // Set document title when component mounts
  useEffect(() => {
    document.title = "Messages | Creator Platform";
  }, []);

  // Select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].other_user_id);
    }
  }, [conversations, selectedConversation]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      markMessagesAsRead(selectedConversation);
    }
  }, [selectedConversation, user?.id, markMessagesAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      await sendMessage({
        receiverId: selectedConversation,
        messageText: newMessage.trim()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    const otherUserName = conv.creator_profile?.display_name || conv.other_user?.username || 'Unknown';
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedConvData = conversations.find(conv => conv.other_user_id === selectedConversation);

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMessage = () => {
    if (messageToDelete) {
      deleteMessageMutation.mutate(messageToDelete);
      setShowDeleteDialog(false);
      setMessageToDelete(null);
    }
  };

  if (conversationsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-800 flex flex-col h-full">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name..."
              className="pl-10 bg-gray-900 border-gray-700 focus-visible:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-800">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => {
                const displayName = conversation.creator_profile?.display_name || 
                                  conversation.other_user?.username || 'Unknown User';
                const avatarUrl = conversation.creator_profile?.profile_image_url ||
                                conversation.other_user?.profile_picture;
                const isCreator = !!conversation.creator_profile;
                
                return (
                  <button
                    key={conversation.other_user_id}
                    className={cn(
                      "w-full flex items-start p-3 gap-3 hover:bg-gray-900/50 transition-colors text-left",
                      selectedConversation === conversation.other_user_id && "bg-gray-900/70",
                    )}
                    onClick={() => handleConversationSelect(conversation.other_user_id)}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10 border border-gray-700">
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback className="bg-purple-900">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{displayName}</span>
                          {isCreator && (
                            <Badge variant="outline" className="h-5 border-purple-500 text-purple-400 text-xs">
                              Creator
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {conversation.last_message_at ? 
                            new Date(conversation.last_message_at).toLocaleDateString() : 
                            'No messages'
                          }
                        </span>
                      </div>
                      {conversation.last_message && (
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.last_message.message_text}
                        </p>
                      )}
                    </div>
                    {conversation.unread_count > 0 && (
                      <Badge className="bg-purple-600 hover:bg-purple-600">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-400">No conversations found</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col h-full">
        {selectedConversation && selectedConvData ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-gray-700">
                    <AvatarImage 
                      src={selectedConvData.creator_profile?.profile_image_url || 
                           selectedConvData.other_user?.profile_picture || undefined} 
                      alt={selectedConvData.creator_profile?.display_name || 
                           selectedConvData.other_user?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-purple-900">
                      {(selectedConvData.creator_profile?.display_name || 
                        selectedConvData.other_user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">
                      {selectedConvData.creator_profile?.display_name || 
                       selectedConvData.other_user?.username || 'Unknown User'}
                    </h2>
                    {selectedConvData.creator_profile && (
                      <Badge variant="outline" className="h-5 border-purple-500 text-purple-400 text-xs">
                        Creator
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Online</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-white">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Star conversation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem className="flex items-center gap-2 text-red-400">Block user</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">Today</span>
                </div>

                {messagesLoading || isMarkingAsRead ? (
                  <div className="flex justify-center items-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={cn("flex", message.sender_id === user?.id ? "justify-end" : "justify-start")}
                    >
                      <div className="flex gap-3 max-w-[70%]">
                        {message.sender_id !== user?.id && (
                          <Avatar className="h-8 w-8 mt-1 border border-gray-700">
                            <AvatarImage 
                              src={selectedConvData.creator_profile?.profile_image_url || 
                                   selectedConvData.other_user?.profile_picture || undefined} 
                            />
                            <AvatarFallback className="bg-purple-900">
                              {(selectedConvData.creator_profile?.display_name || 
                                selectedConvData.other_user?.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div
                            className={cn(
                              "rounded-lg p-3 cursor-pointer transition-colors",
                              message.sender_id === user?.id
                                ? "bg-purple-600 text-white rounded-tr-none hover:bg-purple-700"
                                : "bg-gray-800 text-white rounded-tl-none",
                            )}
                            onClick={() => {
                              if (message.sender_id === user?.id) {
                                handleDeleteMessage(message.id);
                              }
                            }}
                            title={message.sender_id === user?.id ? "Click to delete message" : ""}
                          >
                            <p>{message.message_text}</p>
                          </div>
                          <div
                            className={cn(
                              "flex items-center mt-1 text-xs text-gray-400",
                              message.sender_id === user?.id ? "justify-end" : "justify-start",
                            )}
                          >
                            <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                            {message.sender_id === user?.id && (
                              <span className="ml-1">
                                {message.is_read ? (
                                  <CheckCheck className="h-3 w-3 text-blue-400" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Paperclip className="h-5 w-5" />
                  <span className="sr-only">Attach file</span>
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Type a message..."
                    className="bg-gray-900 border-gray-700 focus-visible:ring-purple-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    disabled={isSendingMessage}
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                  size="icon"
                  disabled={!newMessage.trim() || isSendingMessage}
                >
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      <DeleteMessageDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteMessage}
        isDeleting={deleteMessageMutation.isPending}
      />
    </div>
  );
}
