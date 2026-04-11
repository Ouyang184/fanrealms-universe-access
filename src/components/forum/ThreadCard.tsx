import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

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
  isLast?: boolean;
}

export function ThreadCard({ thread, isLast }: ThreadCardProps) {
  const author = thread.profiles?.username || thread.profiles?.display_name || "?";
  const initials = author.slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/forum/${thread.id}`}
      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${!isLast ? 'border-b border-[#f5f5f5]' : ''}`}
    >
      <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 overflow-hidden">
        {thread.profiles?.profile_image_url
          ? <img src={thread.profiles.profile_image_url} alt="" className="w-full h-full object-cover" />
          : initials
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold leading-snug truncate">{thread.title}</div>
        <div className="text-[11px] text-[#aaa] mt-0.5">
          {thread.category && <span className="mr-1">{thread.category} ·</span>}
          {author} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[13px] font-bold">{thread.reply_count ?? 0}</div>
        <div className="text-[10px] text-[#ccc]">replies</div>
      </div>
    </Link>
  );
}
