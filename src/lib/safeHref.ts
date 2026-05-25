/**
 * Returns the URL if it uses an http(s) scheme or is a safe relative path,
 * otherwise returns '#'. Prevents stored javascript:/data:/vbscript: XSS via
 * user-controlled hrefs.
 */
export function safeHref(url: string | null | undefined): string {
  if (!url) return '#';
  const trimmed = String(url).trim();
  if (!trimmed) return '#';
  // Allow protocol-relative and absolute http(s) URLs
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Allow same-origin relative paths / fragments / mailto
  if (/^(\/|#|mailto:)/.test(trimmed)) return trimmed;
  // If no scheme at all (e.g. "example.com"), prefix https://
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return `https://${trimmed}`;
  return '#';
}
