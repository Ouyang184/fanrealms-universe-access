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
