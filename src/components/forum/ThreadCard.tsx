import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  category?: string;
  reply_count?: number;
  created_at: string;
  profiles?: { username?: string; display_name?: string; profile_image_url?: string };
}

interface ThreadCardProps {
  thread: Thread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const author = thread.profiles?.username || thread.profiles?.display_name || "?";
  const initials = author.slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/forum/${thread.id}`}
      className="group bg-white rounded-xl border border-[#eee] hover:border-[#ccc] p-4 transition-colors flex flex-col gap-3"
    >
      {thread.category && (
        <span className="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {thread.category}
        </span>
      )}
      <div className="text-[14px] font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[42px]">
        {thread.title}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#f5f5f5]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#111] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 overflow-hidden">
            {thread.profiles?.profile_image_url
              ? <img src={thread.profiles.profile_image_url} alt="" className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="text-[11px] text-[#888] truncate">
            {author} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#888] flex-shrink-0">
          <MessageCircle className="w-3 h-3" />
          {thread.reply_count ?? 0}
        </div>
      </div>
    </Link>
  );
}
