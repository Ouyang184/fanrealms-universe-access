
import { useState } from "react";
import { Search, MoreVertical, Send, Paperclip, MessageSquare } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    // TODO: In a real app, you would send the message to an API
    console.log("Sending message:", messageText);
    setMessageText("");
  };

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
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6">
            <div className="mb-4 text-muted-foreground">
              <MessageSquare className="h-12 w-12 opacity-40" />
            </div>
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-sm">
              Your messages with creators and fans will appear here
            </p>
          </div>
        </ScrollArea>
      </div>

      {/* Empty Message Thread */}
      <div className="flex-1 flex flex-col h-full">
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
      </div>
    </div>
  );
}
