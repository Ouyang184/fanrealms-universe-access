
import { MessageData } from "@/hooks/useMessages";
import { Message } from "@/components/messaging/Message";

interface MessagesListProps {
  messages: MessageData[];
  onSelectCreator?: (creator: { id: string; username: string }) => void;
}

export function MessagesList({ messages, onSelectCreator }: MessagesListProps) {
  if (messages.length === 0) {
    return (
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Message
          key={message.id}
          senderName={message.sender_username || "Unknown User"}
          messageText={message.message_text}
          createdAt={message.created_at}
          isRead={message.is_read}
          onClick={onSelectCreator ? () => onSelectCreator({
            id: message.sender_id,
            username: message.sender_username || "Unknown User"
          }) : undefined}
        />
      ))}
    </div>
  );
}
