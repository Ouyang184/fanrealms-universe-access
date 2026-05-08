import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/lib/types/auth';

/**
 * Same regex enforced by CompleteProfile's submit validator. Mirroring
 * it here means the redirect guard agrees with the form: a value the
 * form would reject is treated as "not complete" so the user is sent
 * back to fix it instead of being bounced into the app.
 */
const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;
const DISPLAY_NAME_MAX = 60;

/**
 * Narrow, validated shape required to call a profile "complete". A
 * profile must have:
 *   - a non-empty, trimmed display_name within length bounds
 *   - a username that matches the form's validation regex
 * Anything else (null, empty strings, whitespace-only, malformed
 * username, oversized display_name) is treated as incomplete so the
 * user is reliably routed to /complete-profile.
 */
type CompletionShape = {
  display_name?: string | null;
  username?: string | null;
};

const isValidDisplayName = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= DISPLAY_NAME_MAX;
};

const isValidUsername = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  return USERNAME_RE.test(value.trim().toLowerCase());
};

/**
 * Single source of truth for "is this profile complete enough to leave
 * /complete-profile?". A profile is complete when BOTH display_name
 * and username pass the same validation rules the submit form enforces.
 *
 * Use this everywhere we need a completion check — never re-derive the
 * rule inline. Keeps AuthContext, AuthGuard, route guards, and any
 * post-auth redirect helpers in lockstep, and prevents bounce loops
 * caused by partial/corrupted records that one check would accept and
 * another would reject.
 */
export const isProfileComplete = (
  _profile: (Pick<Profile, 'display_name'> & { username?: string | null }) | null | undefined
): boolean => {
  // Profile completion is no longer required at signup. Users (including
  // future creators) can browse, post, and use the platform without
  // filling in a username, social links, or uploading assets first.
  // Anything they want to set later is reachable from /settings.
  // Returning true here makes AuthGate/AuthGuard skip the forced
  // /complete-profile redirect for every account.
  return true;
};

/**
 * Fetches profile completion straight from Supabase (creators row).
 * Bypasses any cached React state so callers making auth-routing decisions
 * (login redirect, complete-profile guard, post-update navigation) are
 * always working from the persisted truth.
 *
 * Reads BOTH display_name and username and applies the strict validator
 * so a row with e.g. an empty username or whitespace-only display_name
 * is treated as incomplete and the user is sent to /complete-profile.
 *
 * Returns false on missing user, missing creator row, query error, or
 * any validation failure — the conservative answer that routes the user
 * to /complete-profile rather than risking a bounce loop.
 */
export const fetchProfileCompletion = async (
  userId: string
): Promise<boolean> => {
  if (!userId || typeof userId !== 'string') return false;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('display_name, username')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[auth] fetchProfileCompletion failed', error);
      return false;
    }
    if (!data) return false;
    return isProfileComplete(data as CompletionShape);
  } catch (err) {
    console.warn('[auth] fetchProfileCompletion threw', err);
    return false;
  }
};

/**
 * Given a completion flag and a desired returnTo, produce the canonical
 * post-auth destination. Use this anywhere we need to choose between
 * /dashboard (or a custom returnTo) and /complete-profile.
 *
 * Sanitizes returnTo to an in-app absolute path so a corrupted/forged
 * value cannot send the user to an external host or back to
 * /complete-profile (which would create a bounce loop).
 */
export const resolveCompletionRoute = (
  complete: boolean,
  returnTo: string = '/dashboard'
): string => {
  const safeReturn = sanitizeInternalPath(returnTo, '/dashboard');
  if (complete) return safeReturn;
  // Never return to /complete-profile from /complete-profile — would loop.
  const safeForCompletion = safeReturn.startsWith('/complete-profile')
    ? '/dashboard'
    : safeReturn;
  return `/complete-profile?returnTo=${encodeURIComponent(safeForCompletion)}`;
};

const sanitizeInternalPath = (value: string | null | undefined, fallback: string): string => {
  if (typeof value !== 'string' || value.length === 0) return fallback;
  // Must be an in-app absolute path (single leading slash, no scheme,
  // no protocol-relative //, no backslash trick).
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
};
