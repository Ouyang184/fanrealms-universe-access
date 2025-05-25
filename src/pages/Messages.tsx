
import { useState } from "react";
import { Search, MoreVertical, Send, Paperclip, Check, CheckCheck, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for conversations
const conversations = [
  {
    id: "1",
    name: "Emma Wilson",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Thanks for the support!",
    timestamp: "10:42 AM",
    unread: 2,
    online: true,
    isCreator: true,
  },
  {
    id: "2",
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "When is your next live stream?",
    timestamp: "Yesterday",
    unread: 0,
    online: true,
    isCreator: false,
  },
  {
    id: "3",
    name: "Sarah Parker",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "I loved your latest post!",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
    isCreator: true,
  },
  {
    id: "4",
    name: "Michael Davis",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Check out this reference image",
    timestamp: "Monday",
    unread: 0,
    online: false,
    isCreator: false,
  },
];

// Mock data for messages in a conversation
const messages = [
  {
    id: "m1",
    senderId: "1",
    text: "Hey there! Thanks for being such a great supporter of my content.",
    timestamp: "10:30 AM",
    status: "read",
    isOwn: false,
  },
  {
    id: "m2",
    senderId: "user",
    text: "Of course! Your tutorials have been super helpful for my own projects.",
    timestamp: "10:32 AM",
    status: "read",
    isOwn: true,
  },
  {
    id: "m3",
    senderId: "1",
    text: "That's awesome to hear! What kind of projects are you working on?",
    timestamp: "10:33 AM",
    status: "read",
    isOwn: false,
  },
  {
    id: "m4",
    senderId: "user",
    text: "I'm building a small portfolio website using the techniques from your web design series.",
    timestamp: "10:36 AM",
    status: "read",
    isOwn: true,
  },
  {
    id: "m5",
    senderId: "1",
    text: "That's great! I'd love to see it when you're done. By the way, I just posted some new content that might help with your portfolio.",
    timestamp: "10:40 AM",
    status: "read",
    isOwn: false,
  },
  {
    id: "m6",
    senderId: "user",
    text: "Perfect timing! I'll check it out right away.",
    timestamp: "10:41 AM",
    status: "read",
    isOwn: true,
  },
  {
    id: "m7",
    senderId: "1",
    text: "Thanks for the support! Let me know if you have any questions about the new content.",
    timestamp: "10:42 AM",
    status: "delivered",
    isOwn: false,
  },
];

export default function Messages() {
  const { user } = useAuth();
  const [activeConversation, setActiveConversation] = useState(conversations[0]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    // In a real app, you would send the message to an API
    console.log("Sending message:", messageText);
    setMessageText("");
  };

  // Filter conversations based on name search
  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-[calc(100vh-6rem)]">
      {/* Conversations List */}
      <div className="w-80 border-r border-border flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold mb-4">Messages</h1>
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
          <div className="divide-y divide-border">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={cn(
                    "w-full flex items-start p-3 gap-3 hover:bg-muted/50 transition-colors text-left",
                    activeConversation.id === conversation.id && "bg-muted",
                  )}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {conversation.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium truncate">{conversation.name}</span>
                        {conversation.isCreator && (
                          <Badge variant="outline" className="h-5 text-xs">
                            Creator
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  </div>
                  {conversation.unread > 0 && (
                    <Badge className="bg-primary hover:bg-primary/90">{conversation.unread}</Badge>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">No conversations found</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col h-full">
        {/* Conversation Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activeConversation.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {activeConversation.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {activeConversation.online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{activeConversation.name}</h2>
                {activeConversation.isCreator && (
                  <Badge variant="outline" className="h-5 text-xs">
                    Creator
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{activeConversation.online ? "Online" : "Offline"}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Star conversation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-destructive">Block user</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Today</span>
            </div>

            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.isOwn ? "justify-end" : "justify-start")}>
                <div className="flex gap-3 max-w-[70%]">
                  {!message.isOwn && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={activeConversation.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {activeConversation.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div
                      className={cn(
                        "rounded-lg p-3",
                        message.isOwn
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none",
                      )}
                    >
                      <p>{message.text}</p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center mt-1 text-xs text-muted-foreground",
                        message.isOwn ? "justify-end" : "justify-start",
                      )}
                    >
                      <span>{message.timestamp}</span>
                      {message.isOwn && (
                        <span className="ml-1">
                          {message.status === "read" ? (
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
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>
            <div className="flex-1">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              size="icon"
              disabled={!messageText.trim()}
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
