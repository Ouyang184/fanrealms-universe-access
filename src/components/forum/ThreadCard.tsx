import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { MessageSquare, Eye, Pin } from 'lucide-react';
import { format } from 'date-fns';

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    content: string;
    category?: string | null;
    tags?: string[] | null;
    is_pinned: boolean;
    view_count: number;
    reply_count: number;
    created_at: string;
    users?: { username: string; profile_picture?: string | null } | null;
  };
}

export function ThreadCard({ thread }: ThreadCardProps) {
  return (
    <Link to={`/forum/${thread.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {thread.is_pinned && <Pin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base truncate">{thread.title}</h3>
                {thread.category && <Badge variant="outline">{thread.category}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{thread.content}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>by {thread.users?.username || 'Anonymous'}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />{thread.reply_count}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />{thread.view_count}
                </span>
                <span>{format(new Date(thread.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
