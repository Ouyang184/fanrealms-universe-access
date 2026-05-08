import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  creatorId: string;
  creatorUserId?: string | null;
  initialFollowerCount?: number;
  onCountChange?: (n: number) => void;
}

export function FollowButton({ creatorId, creatorUserId, initialFollowerCount, onCountChange }: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isFollowing,
    isLoading,
    setIsFollowing,
    checkFollowStatus,
    followCreator,
    unfollowCreator,
  } = useFollow();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (!creatorId || !user) {
      setReady(true);
      return;
    }
    checkFollowStatus(creatorId).then((res) => {
      if (active) {
        setIsFollowing(res);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [creatorId, user]);

  if (user && creatorUserId && user.id === creatorUserId) return null;

  const handle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isFollowing) {
      await unfollowCreator(creatorId);
      if (typeof initialFollowerCount === 'number') onCountChange?.(Math.max(0, initialFollowerCount - 1));
    } else {
      await followCreator(creatorId);
      if (typeof initialFollowerCount === 'number') onCountChange?.(initialFollowerCount + 1);
    }
  };

  return (
    <Button
      onClick={handle}
      disabled={isLoading || !ready}
      variant={isFollowing ? 'outline' : 'default'}
      className={isFollowing ? '' : 'bg-primary hover:bg-[#3a7aab] text-white'}
      size="sm"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4 mr-1.5" />
      ) : (
        <UserPlus className="w-4 h-4 mr-1.5" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
