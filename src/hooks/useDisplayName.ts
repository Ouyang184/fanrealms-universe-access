import { useMemo } from 'react';
import { getDisplayName, getInitials } from '@/utils/randomNames';

export interface UserWithName {
  username?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  email?: string;
  id?: string;
}

/**
 * Hook to get consistent display names and initials for users
 */
export function useDisplayName(user: UserWithName | null | undefined) {
  return useMemo(() => {
    if (!user) {
      return {
        displayName: 'User',
        initials: 'U'
      };
    }

    const displayName = getDisplayName(user);
    const initials = getInitials(displayName);

    return {
      displayName,
      initials
    };
  }, [user]);
}