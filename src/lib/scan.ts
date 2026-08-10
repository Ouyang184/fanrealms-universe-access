import { supabase } from '@/lib/supabase';

export type ScanStatus = 'pending' | 'clean' | 'infected' | 'error' | 'unscannable';

export const SCAN_LABELS: Record<ScanStatus, string> = {
  pending: 'Scanning…',
  clean: 'Virus scan passed',
  infected: 'Blocked by virus scan',
  error: 'Scan failed',
  unscannable: 'Awaiting manual review',
};

/**
 * Kick off a malware scan for a freshly uploaded file. Fire-and-forget:
 * the scan writes its verdict back to the row, and the download endpoint
 * refuses to hand out a link until the status is `clean`.
 */
export async function triggerScan(table: 'digital_products' | 'product_versions', id: string) {
  try {
    await supabase.functions.invoke('scan-asset-file', { body: { table, id } });
  } catch {
    // Scans also run via the periodic backfill, so a failure here is not fatal.
  }
}
