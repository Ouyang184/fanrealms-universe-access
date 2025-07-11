
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Send, Check, CheckCheck, UserX, UserCheck, ArrowLeft } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useDeleteMessage } from "@/hooks/useDeleteMessage";
import { DeleteMessageDialog } from "@/components/messaging/DeleteMessageDialog";
import { ImageUpload } from "@/components/messaging/ImageUpload";
import { MessageImage } from "@/components/messaging/MessageImage";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Function to detect URLs and convert them to clickable links
const renderMessageWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { conversations, isLoading: conversationsLoading, sendMessage, isSendingMessage } = useConversations();
  const { isUserBlocked, blockUser, unblockUser, isLoading: blockLoading } = useBlockedUsers();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const deleteMessageMutation = useDeleteMessage();

  const { 
    messages, 
    isLoading: messagesLoading,
    markMessagesAsRead,
    isMarkingAsRead
  } = useMessages(selectedConversation);

  // Sort messages chronologically (oldest first)
  const sortedMessages = messages.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Auto-scroll to bottom when messages change or conversation changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages, selectedConversation]);

  // Set document title when component mounts
  useEffect(() => {
    document.title = "Messages | Creator Platform";
  }, []);

  // Select first conversation if none selected and not on mobile
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && !isMobile) {
      setSelectedConversation(conversations[0].other_user_id);
    }
  }, [conversations, selectedConversation, isMobile]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      markMessagesAsRead(selectedConversation);
    }
  }, [selectedConversation, user?.id, markMessagesAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    // Check if user is blocked before sending
    if (isUserBlocked(selectedConversation)) {
      return; // Don't send message if user is blocked
    }
    
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

  const handleImageUpload = async (file: File) => {
    if (!selectedConversation || isUserBlocked(selectedConversation)) return;
    
    setIsUploadingImage(true);
    
    try {
      // Convert image to base64 for simple storage in message text
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          await sendMessage({
            receiverId: selectedConversation,
            messageText: `[IMAGE]${base64String}`
          });
          
          toast({
            title: "Success",
            description: "Image sent successfully!",
          });
        } catch (error) {
          console.error("Error sending image:", error);
          toast({
            title: "Error",
            description: "Failed to send image",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    console.log('Messages.tsx: Setting message for deletion:', messageId);
    setMessageToDelete(messageId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMessage = async () => {
    if (messageToDelete) {
      console.log('Messages.tsx: Confirming deletion for message:', messageToDelete);
      try {
        await deleteMessageMutation.mutateAsync(messageToDelete);
        console.log('Messages.tsx: Delete mutation completed successfully');
      } catch (error) {
        console.error('Messages.tsx: Failed to delete message:', error);
      }
      setShowDeleteDialog(false);
      setMessageToDelete(null);
    }
  };

  const handleMessageClick = (messageId: string, isOwnMessage: boolean) => {
    if (isOwnMessage) {
      console.log('Messages.tsx: Message clicked for deletion:', messageId);
      handleDeleteMessage(messageId);
    }
  };

  const renderMessageContent = (messageText: string, messageId: string, isOwnMessage: boolean) => {
    // Check if message contains an image
    if (messageText.startsWith('[IMAGE]')) {
      const imageData = messageText.substring(7); // Remove '[IMAGE]' prefix
      return (
        <MessageImage 
          src={imageData} 
          alt="Shared image"
          canDelete={isOwnMessage}
          onDelete={() => handleDeleteMessage(messageId)}
        />
      );
    }
    
    // Regular text message with link support
    return renderMessageWithLinks(messageText);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    if (isMobile) {
      setShowConversationsList(false);
    }
  };

  const handleBackToConversations = () => {
    if (isMobile) {
      setShowConversationsList(true);
      setSelectedConversation(null);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation) return;
    
    if (isUserBlocked(selectedConversation)) {
      await unblockUser(selectedConversation);
    } else {
      await blockUser(selectedConversation);
    }
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    const otherUserName = conv.creator_profile?.display_name || 
                          conv.other_user?.username || 'Unknown';
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedConvData = conversations.find(conv => conv.other_user_id === selectedConversation);
  const isSelectedUserBlocked = selectedConversation ? isUserBlocked(selectedConversation) : false;

  if (conversationsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex min-h-0",
      isMobile ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-8rem)]"
    )}>
      {/* Conversations List */}
      <div className={cn(
        "border-r border-gray-800 flex flex-col min-h-0",
        isMobile ? (showConversationsList ? "w-full" : "hidden") : "w-80"
      )}>
        <div className={cn("border-b border-gray-800", isMobile ? "p-3" : "p-4")}>
          <h1 className={cn("font-bold mb-4", isMobile ? "text-lg" : "text-xl")}>Messages</h1>
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
                const isBlocked = isUserBlocked(conversation.other_user_id);
                
                return (
                  <button
                    key={conversation.other_user_id}
                    className={cn(
                      "w-full flex items-start gap-3 hover:bg-gray-900/50 transition-colors text-left",
                      isMobile ? "p-3" : "p-3",
                      selectedConversation === conversation.other_user_id && "bg-gray-900/70",
                      isBlocked && "opacity-50"
                    )}
                    onClick={() => handleConversationSelect(conversation.other_user_id)}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className={cn("border border-gray-700", isMobile ? "h-12 w-12" : "h-10 w-10")}>
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback className="bg-purple-900">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {!isBlocked && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("font-medium truncate", isMobile ? "text-base" : "text-sm")}>{displayName}</span>
                          {isCreator && (
                            <Badge variant="outline" className="h-5 border-purple-500 text-purple-400 text-xs">
                              Creator
                            </Badge>
                          )}
                          {isBlocked && (
                            <Badge variant="outline" className="h-5 border-red-500 text-red-400 text-xs">
                              Blocked
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
                      {conversation.last_message && !isBlocked && (
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.last_message.message_text}
                        </p>
                      )}
                      {isBlocked && (
                        <p className="text-sm text-red-400 truncate">
                          Messages are blocked
                        </p>
                      )}
                    </div>
                    {!isBlocked && conversation.unread_count > 0 && (
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
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        isMobile && showConversationsList && "hidden"
      )}>
        {selectedConversation && selectedConvData ? (
          <>
            {/* Conversation Header */}
            <div className={cn("border-b border-gray-800 flex items-center justify-between", isMobile ? "p-3" : "p-4")}>
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleBackToConversations}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <div className="relative">
                  <Avatar className={cn("border border-gray-700", isMobile ? "h-10 w-10" : "h-10 w-10")}>
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
                  {!isSelectedUserBlocked && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
                      {selectedConvData.creator_profile?.display_name || 
                       selectedConvData.other_user?.username || 'Unknown User'}
                    </h2>
                    {selectedConvData.creator_profile && (
                      <Badge variant="outline" className="h-5 border-purple-500 text-purple-400 text-xs">
                        Creator
                      </Badge>
                    )}
                    {isSelectedUserBlocked && (
                      <Badge variant="outline" className="h-5 border-red-500 text-red-400 text-xs">
                        Blocked
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {isSelectedUserBlocked ? 'Blocked' : 'Online'}
                  </p>
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
                  <DropdownMenuItem 
                    className="flex items-center gap-2 text-red-400 cursor-pointer"
                    onClick={handleBlockUser}
                    disabled={blockLoading}
                  >
                    {isSelectedUserBlocked ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Unblock user
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4" />
                        Block user
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">Today</span>
                </div>

                {isSelectedUserBlocked ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <UserX className="h-12 w-12 mb-4 text-red-400" />
                    <p className="text-lg font-medium">User is blocked</p>
                    <p className="text-sm">You have blocked this user. Messages are hidden.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleBlockUser}
                      disabled={blockLoading}
                    >
                      Unblock User
                    </Button>
                  </div>
                ) : messagesLoading || isMarkingAsRead ? (
                  <div className="flex justify-center items-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : sortedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation</p>
                  </div>
                ) : (
                  sortedMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={cn("flex", message.sender_id === user?.id ? "justify-end" : "justify-start")}
                    >
                      <div className={cn("flex gap-3", isMobile ? "max-w-[85%]" : "max-w-[70%]")}>
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
                              "rounded-lg p-3 transition-colors",
                              isMobile ? "text-sm" : "text-base",
                              message.sender_id === user?.id
                                ? "bg-purple-600 text-white rounded-tr-none"
                                : "bg-gray-800 text-white rounded-tl-none",
                              message.sender_id === user?.id && "cursor-pointer hover:bg-purple-700"
                            )}
                            onClick={() => handleMessageClick(message.id, message.sender_id === user?.id)}
                            title={message.sender_id === user?.id ? "Click to delete message" : ""}
                          >
                            {renderMessageContent(message.message_text, message.id, message.sender_id === user?.id)}
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            {!isSelectedUserBlocked && (
              <div className={cn("border-t border-gray-800", isMobile ? "p-3" : "p-4")}>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <ImageUpload 
                    onImageSelect={handleImageUpload}
                    disabled={isSendingMessage || isUploadingImage}
                  />
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
                      disabled={isSendingMessage || isUploadingImage}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                    size="icon"
                    disabled={!newMessage.trim() || isSendingMessage || isUploadingImage}
                  >
                    {isSendingMessage || isUploadingImage ? (
                      <LoadingSpinner className="h-5 w-5" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
              </div>
            )}
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
