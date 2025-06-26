
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { ImageUpload } from "@/components/messaging/ImageUpload";
import { MessageImage } from "@/components/messaging/MessageImage";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
}

interface CreatorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
}

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

export function CreatorChatModal({ 
  isOpen, 
  onClose, 
  creatorId, 
  creatorName, 
  creatorAvatar 
}: CreatorChatModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      // Hard delete the message from the database
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId as any)
        .eq('sender_id', user.id as any); // Only allow deleting own messages

      if (error) throw error;

      // Remove the message from local state immediately
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
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

  // Load messages between user and creator
  useEffect(() => {
    if (!isOpen || !user || !creatorId) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${creatorId}),and(sender_id.eq.${creatorId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages((data as any) || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [isOpen, user, creatorId, toast]);

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!isOpen || !user || !creatorId) return;

    const channel = supabase
      .channel(`chat-${user.id}-${creatorId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${creatorId}),and(sender_id.eq.${creatorId},receiver_id.eq.${user.id}))` 
        }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${creatorId}),and(sender_id.eq.${creatorId},receiver_id.eq.${user.id}))` 
        }, 
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user, creatorId]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: creatorId,
          message_text: newMessage.trim(),
          is_read: false
        } as any);

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

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    
    setIsUploadingImage(true);
    
    try {
      // Convert image to base64 for simple storage in message text
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          const { error } = await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              receiver_id: creatorId,
              message_text: `[IMAGE]${base64String}`,
              is_read: false
            } as any);

          if (error) throw error;
          
          toast({
            title: "Success",
            description: "Image sent successfully!",
          });
        } catch (error) {
          console.error('Error sending image:', error);
          toast({
            title: "Error",
            description: "Failed to send image",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creatorAvatar} alt={creatorName} />
              <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-lg">{creatorName}</DialogTitle>
              <p className="text-sm text-muted-foreground">Active now</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-muted-foreground mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground cursor-pointer hover:opacity-80'
                        : 'bg-muted'
                    }`}
                    onClick={isOwnMessage ? () => handleDeleteMessage(message.id) : undefined}
                    title={isOwnMessage ? "Click to delete message" : ""}
                  >
                    <div className="text-sm">
                      {renderMessageContent(message.message_text, message.id, isOwnMessage)}
                    </div>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatRelativeDate(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2 items-end">
            <ImageUpload 
              onImageSelect={handleImageUpload}
              disabled={isSending || isUploadingImage}
            />
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[100px] resize-none flex-1"
              rows={1}
              disabled={isSending || isUploadingImage}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || isSending || isUploadingImage}
              size="sm"
              className="shrink-0"
            >
              {isSending || isUploadingImage ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
