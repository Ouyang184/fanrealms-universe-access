
import { formatRelativeDate } from "@/utils/auth-helpers";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MessageProps {
  senderName: string;
  messageText: string;
  createdAt: string;
  isRead: boolean;
  onClick?: () => void;
}

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
        <p className="text-sm">{messageText}</p>
      </CardContent>
    </Card>
  );
}
