import { supabase } from '@/lib/supabase';

// Extract storage path from a Supabase Storage URL or return null if not applicable
export function extractStoragePath(urlOrPath: string, bucket = 'post-attachments'): string | null {
  if (!urlOrPath) return null;
  // Already a storage path (no scheme)
  if (!/^https?:\/\//i.test(urlOrPath)) {
    // Ensure it starts with bucket/
    return urlOrPath.startsWith(`${bucket}/`) ? urlOrPath : `${bucket}/${urlOrPath}`;
  }

  try {
    const u = new URL(urlOrPath);
    const parts = u.pathname.split('/');
    const idx = parts.findIndex(p => p === bucket);
    if (idx !== -1 && idx + 1 < parts.length) {
      const pathAfterBucket = parts.slice(idx + 1).join('/');
      return `${bucket}/${decodeURIComponent(pathAfterBucket)}`;
    }
  } catch {}
  return null;
}

// Create a signed URL if the input is a storage path or a Supabase Storage URL
export async function getSignedUrl(urlOrPath: string, bucket = 'post-attachments', expiresIn = 3600): Promise<string> {
  if (!urlOrPath) return urlOrPath;

  const maybePath = extractStoragePath(urlOrPath, bucket);
  if (!maybePath) {
    // Not a storage object, return original
    return urlOrPath;
  }

  const pathWithoutBucket = maybePath.replace(new RegExp(`^${bucket}/`), '');
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathWithoutBucket, expiresIn);

  if (error || !data?.signedUrl) {
    console.error('Failed to create signed URL for', maybePath, error);
    return urlOrPath; // fallback
  }
  return data.signedUrl;
}
