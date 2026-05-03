import { cn } from '@/lib/utils';

export interface ThreadAuthor {
  username?: string | null;
  profile_picture?: string | null;
}

interface ThreadAuthorAvatarProps {
  user?: ThreadAuthor | null;
  /** Tailwind size + shape classes (default: w-8 h-8 rounded-lg). */
  className?: string;
  /** Background + text classes for the initials fallback. */
  fallbackClassName?: string;
  /** Text size for initials. */
  textClassName?: string;
}

export function ThreadAuthorAvatar({
  user,
  className = 'w-8 h-8 rounded-lg',
  fallbackClassName = 'bg-foreground/90 text-background',
  textClassName = 'text-[11px]',
}: ThreadAuthorAvatarProps) {
  const initials = (user?.username || '?').slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center justify-center font-bold flex-shrink-0 overflow-hidden',
        className,
        !user?.profile_picture && fallbackClassName,
        !user?.profile_picture && textClassName,
      )}
    >
      {user?.profile_picture ? (
        <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
