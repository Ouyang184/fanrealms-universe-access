import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/lib/types/auth';

/**
 * Single source of truth for "is this profile complete enough to leave
 * /complete-profile?". A profile is complete when it has a non-empty
 * display_name (sourced from the creators row, see useProfile).
 *
 * Use this everywhere we need a completion check — never re-derive the
 * rule inline. Keeps AuthContext, AuthGuard, route guards, and any
 * post-auth redirect helpers in lockstep.
 */
export const isProfileComplete = (
  profile: Pick<Profile, 'display_name'> | null | undefined
): boolean => !!(profile?.display_name && profile.display_name.trim());

/**
 * Fetches profile completion straight from Supabase (creators.display_name).
 * Bypasses any cached React state so callers making auth-routing decisions
 * (login redirect, complete-profile guard, post-update navigation) are
 * always working from the persisted truth.
 *
 * Returns false on missing user, missing creator row, or query error —
 * the conservative answer that routes the user to /complete-profile.
 */
export const fetchProfileCompletion = async (
  userId: string
): Promise<boolean> => {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[auth] fetchProfileCompletion failed', error);
      return false;
    }
    return isProfileComplete(data as { display_name?: string | null } | null);
  } catch (err) {
    console.warn('[auth] fetchProfileCompletion threw', err);
    return false;
  }
};

/**
 * Given a completion flag and a desired returnTo, produce the canonical
 * post-auth destination. Use this anywhere we need to choose between
 * /dashboard (or a custom returnTo) and /complete-profile.
 */
export const resolveCompletionRoute = (
  complete: boolean,
  returnTo: string = '/dashboard'
): string =>
  complete ? returnTo : `/complete-profile?returnTo=${encodeURIComponent(returnTo)}`;
