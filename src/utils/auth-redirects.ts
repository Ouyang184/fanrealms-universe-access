/**
 * Safe redirect helpers to prevent infinite auth redirect loops.
 *
 * Rules enforced:
 *  - returnTo must be a same-origin absolute path starting with "/"
 *  - returnTo must not point at auth pages (/login, /signup, /auth/*, /logout)
 *  - returnTo must not nest another returnTo to itself
 */

const AUTH_PATHS = ['/login', '/signup', '/logout', '/auth/callback', '/auth'];

export function isAuthPath(pathname: string): boolean {
  if (!pathname) return false;
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`)
  );
}

/**
 * Sanitize a returnTo value coming from the URL or app state.
 * Returns a safe path or the provided fallback.
 */
export function sanitizeReturnTo(
  raw: string | null | undefined,
  fallback: string = '/dashboard'
): string {
  if (!raw) return fallback;
  let value = raw.trim();
  if (!value) return fallback;

  // Reject protocol-relative or absolute URLs
  if (value.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    return fallback;
  }

  if (!value.startsWith('/')) {
    value = `/${value}`;
  }

  // Strip any path that points at auth screens — would cause a loop
  try {
    const url = new URL(value, 'http://x.local');
    if (isAuthPath(url.pathname)) return fallback;
    // Don't allow nested returnTo chains pointing back to auth
    const nested = url.searchParams.get('returnTo');
    if (nested && isAuthPath(nested)) {
      url.searchParams.delete('returnTo');
    }
    return url.pathname + (url.search || '');
  } catch {
    return fallback;
  }
}

/**
 * Build a /login URL with a safe returnTo, avoiding self-references.
 */
export function buildLoginUrl(currentPath: string, currentSearch: string = ''): string {
  if (isAuthPath(currentPath)) {
    return '/login';
  }
  const target = `${currentPath}${currentSearch || ''}`;
  return `/login?returnTo=${encodeURIComponent(target)}`;
}
