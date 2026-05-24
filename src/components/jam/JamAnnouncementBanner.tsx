import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Trophy } from 'lucide-react';
import { useActiveJam, getJamStatus } from '@/hooks/useJam';
import { format } from 'date-fns';

const STORAGE_KEY = 'dismissed-jam-banner';

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function setDismissed(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function JamAnnouncementBanner() {
  const { data: jam } = useActiveJam();
  const [dismissed, setDismissedState] = useState<string[]>(getDismissed);

  if (!jam) return null;

  const status = getJamStatus(jam);
  // Only show for upcoming and active — not voting, not ended
  if (status !== 'upcoming' && status !== 'active') return null;
  if (dismissed.includes(jam.id)) return null;

  const dismiss = () => {
    const next = [...dismissed, jam.id];
    setDismissed(next);
    setDismissedState(next);
  };

  const statusLabel =
    status === 'upcoming'
      ? `Opens ${format(new Date(jam.starts_at), 'MMM d')}`
      : `Open for submissions until ${format(new Date(jam.ends_at), 'MMM d')}`;

  return (
    <div className="w-full bg-primary text-white text-[13px] px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Trophy className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold truncate">{jam.title}</span>
        <span className="opacity-75 hidden sm:inline">·</span>
        <span className="opacity-75 hidden sm:inline">{statusLabel}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          to={`/jam/${jam.id}`}
          className="bg-white text-primary text-[12px] font-semibold px-3 py-1 rounded-full hover:bg-white/90 transition-colors"
        >
          {status === 'upcoming' ? 'Learn more' : 'Enter now'}
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="opacity-75 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
