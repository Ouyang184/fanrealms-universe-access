
import { formatRelativeDate } from "@/utils/auth-helpers";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MessageProps {
  senderName: string;
  messageText: string;
  createdAt: string;
  isRead: boolean;
  onClick?: () => void;
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
          onClick={(e) => e.stopPropagation()} // Prevent triggering the message onClick
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export function Message({ senderName, messageText, createdAt, isRead, onClick }: MessageProps) {
  return (
    <Card 
      className={`${!isRead ? 'bg-accent/5' : ''} ${onClick ? 'cursor-pointer hover:bg-accent/10' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <span className="font-medium">{senderName}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(createdAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm">
          {renderMessageWithLinks(messageText)}
        </p>
      </CardContent>
    </Card>
  );
}
