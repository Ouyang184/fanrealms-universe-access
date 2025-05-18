
import { useState } from "react";
import { MessagesList } from "@/components/messaging/MessagesList";
import { SendMessageDialog } from "@/components/messaging/SendMessageDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";

export default function Messages() {
  const { user } = useAuth();
  const [selectedCreator, setSelectedCreator] = useState<{id: string, username: string} | null>(null);
  const { messages, isLoading } = useMessages(user?.id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Direct Messages</h1>
      </div>

      <MessagesList 
        messages={messages} 
        onSelectCreator={setSelectedCreator}
      />

      {selectedCreator && (
        <SendMessageDialog
          isOpen={!!selectedCreator}
          onClose={() => setSelectedCreator(null)}
          receiverId={selectedCreator.id}
          receiverName={selectedCreator.username}
        />
      )}
    </div>
  );
}
