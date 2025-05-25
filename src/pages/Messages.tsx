import { useState } from "react";
import { Search, MoreVertical, Send, Paperclip, MessageSquare, Check, CheckCheck, Users, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, ConversationParticipant } from "@/hooks/useConversations";
import { useMessages, MessageData } from "@/hooks/useMessages";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { LiveChat } from "@/components/messaging/LiveChat";

export default function Messages() {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<ConversationParticipant | null>(null);

  const { conversations, isLoading: conversationsLoading, sendMessage, isSendingMessage } = useConversations();
  const { messages, isLoading: messagesLoading } = useMessages(user?.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !user) return;

    sendMessage({
      receiverId: selectedConversation.other_user_id,
      messageText: messageText.trim()
    });
    setMessageText("");
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conversation) => {
    const displayName = conversation.creator_profile?.display_name || conversation.other_user?.username || 'Unknown User';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get messages for selected conversation
  const conversationMessages = selectedConversation ? messages.filter((msg: MessageData) => 
    (msg.sender_id === user?.id && msg.receiver_id === selectedConversation.other_user_id) ||
    (msg.sender_id === selectedConversation.other_user_id && msg.receiver_id === user?.id)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : [];

  return (
    <div className="flex h-[calc(100vh-6rem)]">
      <Tabs defaultValue="direct" className="flex-1 flex flex-col">
        <div className="border-b border-border">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Direct Messages
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Live Chat
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="direct" className="flex-1 flex m-0">
          {/* Direct Messages - existing code */}
          <div className="w-80 border-r border-border flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold mb-4">Direct Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6">
                  <div className="mb-4 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 opacity-40" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Follow creators to start conversations, or wait for messages from your followers
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conversation) => {
                    const displayName = conversation.creator_profile?.display_name || conversation.other_user?.username || 'Unknown User';
                    const avatarUrl = conversation.creator_profile?.profile_image_url || conversation.other_user?.profile_picture;
                    const lastMessageText = conversation.last_message?.message_text || 'Start a conversation...';
                    const isCreator = !!conversation.creator_profile;

                    return (
                      <button
                        key={conversation.id}
                        className={cn(
                          "w-full flex items-start p-3 gap-3 hover:bg-muted/50 transition-colors text-left",
                          selectedConversation?.id === conversation.id && "bg-muted/70",
                        )}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                          <AvatarFallback>
                            {displayName.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">{displayName}</span>
                              {isCreator && (
                                <Badge variant="outline" className="h-5 text-xs">
                                  Creator
                                </Badge>
                              )}
                            </div>
                            {conversation.last_message && (
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeDate(conversation.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{lastMessageText}</p>
                        </div>
                        
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-primary hover:bg-primary">{conversation.unread_count}</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Message Thread */}
          <div className="flex-1 flex flex-col h-full">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={selectedConversation.creator_profile?.profile_image_url || selectedConversation.other_user?.profile_picture || undefined} 
                        alt={selectedConversation.creator_profile?.display_name || selectedConversation.other_user?.username || 'Unknown User'} 
                      />
                      <AvatarFallback>
                        {(selectedConversation.creator_profile?.display_name || selectedConversation.other_user?.username || 'Unknown User')
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">
                          {selectedConversation.creator_profile?.display_name || selectedConversation.other_user?.username || 'Unknown User'}
                        </h2>
                        {selectedConversation.creator_profile && (
                          <Badge variant="outline" className="h-5 text-xs">
                            Creator
                          </Badge>
                        )}
                      </div>
                      {selectedConversation.creator_profile?.bio && (
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {selectedConversation.creator_profile.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Block User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {conversationMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="mb-4 text-muted-foreground">
                          <MessageSquare className="h-16 w-16 opacity-40 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
                        <p className="text-muted-foreground">
                          Send the first message to begin chatting
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversationMessages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        const senderName = isOwn ? 'You' : 
                          (selectedConversation.creator_profile?.display_name || selectedConversation.other_user?.username || 'Unknown User');

                        return (
                          <div key={message.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                            <div className="flex gap-3 max-w-[70%]">
                              {!isOwn && (
                                <Avatar className="h-8 w-8 mt-1">
                                  <AvatarImage 
                                    src={selectedConversation.creator_profile?.profile_image_url || selectedConversation.other_user?.profile_picture || undefined} 
                                    alt={senderName} 
                                  />
                                  <AvatarFallback>
                                    {senderName.split(" ").map((n: string) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <div
                                  className={cn(
                                    "rounded-lg p-3",
                                    isOwn
                                      ? "bg-primary text-primary-foreground rounded-tr-none"
                                      : "bg-muted rounded-tl-none",
                                  )}
                                >
                                  <p>{message.message_text}</p>
                                </div>
                                <div
                                  className={cn(
                                    "flex items-center mt-1 text-xs text-muted-foreground",
                                    isOwn ? "justify-end" : "justify-start",
                                  )}
                                >
                                  <span>{formatRelativeDate(message.created_at)}</span>
                                  {isOwn && (
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
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
                      <Paperclip className="h-5 w-5" />
                      <span className="sr-only">Attach file</span>
                    </Button>
                    <div className="flex-1">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        disabled={isSendingMessage}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!messageText.trim() || isSendingMessage}
                    >
                      <Send className="h-5 w-5" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 opacity-40 mx-auto" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                  <p className="text-muted-foreground">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="live" className="flex-1 m-0">
          <LiveChat />
        </TabsContent>
      </Tabs>
    </div>
  );
}
