
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users } from "lucide-react";
import { formatRelativeDate } from "@/utils/auth-helpers";

interface LiveChatMessage {
  id: string;
  user_id: string;
  message_text: string;
  created_at: string;
  user: {
    username: string;
    profile_picture?: string;
  };
}

export function LiveChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('live_chat_messages')
          .select(`
            id,
            user_id,
            message_text,
            created_at,
            users (
              username,
              profile_picture
            )
          `)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        const formattedMessages = data?.map(msg => ({
          id: msg.id,
          user_id: msg.user_id,
          message_text: msg.message_text,
          created_at: msg.created_at,
          user: {
            username: msg.users?.username || 'Unknown User',
            profile_picture: msg.users?.profile_picture
          }
        })) || [];

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [toast]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('live-chat')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'live_chat_messages'
        }, 
        async (payload) => {
          // Fetch user data for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('username, profile_picture')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: LiveChatMessage = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            message_text: payload.new.message_text,
            created_at: payload.new.created_at,
            user: {
              username: userData?.username || 'Unknown User',
              profile_picture: userData?.profile_picture
            }
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Track online users with presence
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('live-chat-presence')
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const userCount = Object.keys(newState).length;
        setOnlineUsers(userCount);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceTrackStatus = await channel.track({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'Anonymous',
            online_at: new Date().toISOString(),
          });
          console.log('Presence track status:', presenceTrackStatus);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          user_id: user.id,
          message_text: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Join the conversation</h3>
          <p className="text-muted-foreground">Please log in to participate in the live chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Live Chat</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{onlineUsers} online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
              <p className="text-muted-foreground">Be the first to send a message in the live chat</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.user_id === user.id;
              
              return (
                <div key={message.id} className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={message.user.profile_picture} alt={message.user.username} />
                      <AvatarFallback>
                        {message.user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-first' : ''}`}>
                    {!isOwnMessage && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {message.user.username}
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm">{message.message_text}</p>
                    </div>
                    <div className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      {formatRelativeDate(message.created_at)}
                    </div>
                  </div>
                  
                  {isOwnMessage && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={message.user.profile_picture} alt="You" />
                      <AvatarFallback>
                        You
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
