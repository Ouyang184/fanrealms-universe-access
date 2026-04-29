import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Eye, Pin } from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  category?: string;
  reply_count?: number;
  view_count?: number;
  is_pinned?: boolean;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  users?: { username?: string; profile_picture?: string } | null;
}

interface ThreadRowProps {
  thread: Thread;
}

export function ThreadRow({ thread }: ThreadRowProps) {
  const author = thread.users?.username || 'Anonymous';
  const initials = author.slice(0, 2).toUpperCase();
  const lastActivity = thread.updated_at || thread.created_at;

  return (
    <Link
      to={`/forum/${thread.id}`}
      className="group flex items-center gap-4 px-4 py-3 border-b border-border bg-card hover:bg-accent/40 transition-colors"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-foreground/90 flex items-center justify-center text-background text-[11px] font-bold flex-shrink-0 overflow-hidden">
        {thread.users?.profile_picture ? (
          <img src={thread.users.profile_picture} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {thread.is_pinned && (
            <Pin className="w-3 h-3 text-primary flex-shrink-0" />
          )}
          {thread.category && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
              {thread.category}
            </span>
          )}
          {thread.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          <span className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {thread.title}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {author} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex flex-col items-end text-[11px] text-muted-foreground gap-0.5 w-20 flex-shrink-0">
        <div className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          <span className="font-semibold text-foreground">{thread.reply_count ?? 0}</span>
          <span>replies</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span className="font-semibold text-foreground">{thread.view_count ?? 0}</span>
          <span>views</span>
        </div>
      </div>

      {/* Last activity */}
      <div className="hidden md:block text-[11px] text-muted-foreground w-24 text-right flex-shrink-0">
        {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
      </div>
    </Link>
  );
}
