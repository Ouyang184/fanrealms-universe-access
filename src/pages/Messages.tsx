
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Search, Send, Users } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversations, isLoading: conversationsLoading } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { 
    messages, 
    isLoading: messagesLoading, 
    sendMessage, 
    isSendingMessage 
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

  const handleSendMessage = async () => {
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

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    const otherUserName = conv.creator_profile?.display_name || conv.other_user?.username || 'Unknown';
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedConvData = conversations.find(conv => conv.other_user_id === selectedConversation);

  if (conversationsLoading) {
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
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Direct messages with creators and other users
            </p>
          </div>

          <Tabs defaultValue="direct" className="space-y-6">
            <TabsList>
              <TabsTrigger value="direct">Direct Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Conversations List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Conversations ({filteredConversations.length})
                    </CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                      {filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                          <p>No conversations found</p>
                          {searchTerm && (
                            <p className="text-sm">Try adjusting your search</p>
                          )}
                        </div>
                      ) : (
                        filteredConversations.map((conversation) => {
                          const displayName = conversation.creator_profile?.display_name || 
                                            conversation.other_user?.username || 'Unknown User';
                          const avatarUrl = conversation.creator_profile?.profile_image_url ||
                                          conversation.other_user?.profile_picture;
                          
                          return (
                            <div
                              key={conversation.other_user_id}
                              className={`p-4 cursor-pointer hover:bg-muted/50 border-l-4 transition-colors ${
                                selectedConversation === conversation.other_user_id
                                  ? 'bg-muted border-l-primary'
                                  : 'border-l-transparent'
                              }`}
                              onClick={() => setSelectedConversation(conversation.other_user_id)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                                  <AvatarFallback>
                                    {displayName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-medium truncate">{displayName}</h3>
                                    {conversation.unread_count > 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        {conversation.unread_count}
                                      </Badge>
                                    )}
                                  </div>
                                  {conversation.last_message && (
                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                      {conversation.last_message.message_text}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {conversation.last_message_at ? 
                                      new Date(conversation.last_message_at).toLocaleDateString() : 
                                      'No messages'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2">
                  {selectedConversation && selectedConvData ? (
                    <>
                      <CardHeader className="border-b">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={selectedConvData.creator_profile?.profile_image_url || 
                                   selectedConvData.other_user?.profile_picture || undefined} 
                              alt={selectedConvData.creator_profile?.display_name || 
                                   selectedConvData.other_user?.username || 'User'} 
                            />
                            <AvatarFallback>
                              {(selectedConvData.creator_profile?.display_name || 
                                selectedConvData.other_user?.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {selectedConvData.creator_profile?.display_name || 
                               selectedConvData.other_user?.username || 'Unknown User'}
                            </h3>
                            {selectedConvData.creator_profile?.bio && (
                              <p className="text-sm text-muted-foreground">
                                {selectedConvData.creator_profile.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 p-4">
                        <div className="flex flex-col h-[400px]">
                          {/* Messages */}
                          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                            {messagesLoading ? (
                              <div className="flex justify-center items-center h-full">
                                <LoadingSpinner />
                              </div>
                            ) : messages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mb-4" />
                                <p>No messages yet</p>
                                <p className="text-sm">Send a message to start the conversation</p>
                              </div>
                            ) : (
                              messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${
                                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[70%] p-3 rounded-lg ${
                                      message.sender_id === user?.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                                  >
                                    <p className="text-sm">{message.message_text}</p>
                                    <p className={`text-xs mt-1 ${
                                      message.sender_id === user?.id 
                                        ? 'text-primary-foreground/70' 
                                        : 'text-muted-foreground'
                                    }`}>
                                      {new Date(message.created_at).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Message Input */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              disabled={isSendingMessage}
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim() || isSendingMessage}
                              size="icon"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                        <p>Choose a conversation from the list to start messaging</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
