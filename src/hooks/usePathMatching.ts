import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Normalize a pathname for sidebar / nav matching.
 *
 *   - undefined / null / empty / non-string → "/"
 *   - collapse repeated slashes ("/a//b"    → "/a/b")
 *   - ensure a leading slash    ("foo"      → "/foo")
 *   - strip trailing slash except root      ("/a/" → "/a", "/" → "/")
 *   - lowercase so casing differences don't break matching
 *
 * Result: "/Dashboard/Assets/", "/dashboard//assets", "/dashboard/assets/"
 * and "/dashboard/assets" all normalize to "/dashboard/assets".
 */
export function normalizePath(p: unknown): string {
  if (typeof p !== 'string' || p.length === 0) return '/';
  let n = p.replace(/\/{2,}/g, '/').toLowerCase();
  if (!n.startsWith('/')) n = '/' + n;
  if (n.length > 1 && n.endsWith('/')) n = n.slice(0, -1);
  return n;
}

/**
 * Returns true when `path` is equal to `to` or sits underneath it as a
 * proper segment prefix (so "/dashboard" matches "/dashboard/assets" but
 * not "/dashboard-foo"). Both inputs are normalized first so the same
 * rules apply everywhere.
 */
export function matchesPrefix(path: unknown, to: unknown): boolean {
  const a = normalizePath(path);
  const b = normalizePath(to);
  if (a === b) return true;
  // Root "/" should never prefix-match every other path.
  if (b === '/') return false;
  return a.startsWith(b + '/');
}

/**
 * Hook returning the current pathname already normalized for matching.
 * Centralizing this guarantees every nav surface uses identical rules.
 */
export function useNormalizedPath(): string {
  const { pathname } = useLocation();
  return useMemo(() => normalizePath(pathname), [pathname]);
}

/**
 * Pick the single longest-prefix winner from `candidates` for the given
 * `path`. Earlier entries beat later ones on ties so callers control
 * priority via list order. Returns null when nothing matches.
 *
 * Used so every nav surface highlights exactly one item — e.g.
 * /dashboard/assets → "Assets", never both "Dashboard" and "Assets".
 */
export function pickLongestPrefixMatch(
  path: unknown,
  candidates: readonly string[]
): string | null {
  let winner: string | null = null;
  let winnerLen = -1;
  let winnerIdx = -1;
  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i];
    if (!matchesPrefix(path, p)) continue;
    if (
      winner === null ||
      p.length > winnerLen ||
      (p.length === winnerLen && i < winnerIdx)
    ) {
      winner = p;
      winnerLen = p.length;
      winnerIdx = i;
    }
  }
  return winner;
}

/**
 * Hook variant that memoizes the longest-prefix winner against the
 * current normalized pathname. Pass a stable `candidates` array (module
 * constant or useMemo result) to avoid recomputing every render.
 */
export function useActivePath(candidates: readonly string[]): string | null {
  const path = useNormalizedPath();
  return useMemo(() => pickLongestPrefixMatch(path, candidates), [path, candidates]);
}
