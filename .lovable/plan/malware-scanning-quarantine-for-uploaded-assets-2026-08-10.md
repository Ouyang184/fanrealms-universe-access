# Malware scanning + quarantine for uploaded assets

Add virus scanning for creator-uploaded asset files, covering both **files already uploaded** (3 products currently have an asset file, plus any product versions) and all future uploads, with a quarantine workflow that blocks downloads until a file is cleared.

## How it works

1. Every asset file gets a scan state: `pending`, `clean`, `infected`, or `error`.
2. A backend function downloads the file from private storage, computes its SHA-256 hash, and asks VirusTotal about that hash.
   - Known-bad hash -> `infected`, file quarantined.
   - Known-good hash -> `clean`.
   - Unknown hash and file under 32MB -> upload bytes to VirusTotal for a full scan, then poll for the verdict.
   - Unknown hash and file too large -> stays `pending` and is flagged for manual review (large zips can't be scanned by the API).
3. Downloads are blocked unless the file is `clean`. Buyers of a quarantined product get a clear message instead of a signed URL.
4. Creators see the scan badge on their asset in the dashboard; infected uploads can't be published.
5. A backfill run scans everything already in storage.

## What gets built

**Database**
- New columns on `digital_products` and `product_versions`: `scan_status`, `scan_verdict` (JSON detail), `scan_hash`, `scanned_at`.
- Existing rows default to `pending` so the backfill picks them up.
- Column-level grants matching the existing safe-column model (read-only for the owner/public where needed, writes only by the service role).

**Edge function `scan-asset-file`**
- Input: `{ table: 'digital_products' | 'product_versions', id }`.
- Downloads the object from the `product-files` bucket with the service role, hashes it, queries VirusTotal, writes the verdict back.
- Handles the 4 requests/minute free-tier limit with retries and returns `pending` rather than failing hard.

**Edge function `scan-backfill`**
- Iterates every row with `scan_status = 'pending'` and calls the scanner, spaced out to respect rate limits. Run once now for the existing uploads, and safe to re-run.

**Download gate**
- `get-download-url` returns 403 with "This file is being reviewed" when `scan_status` is not `clean`.

**UI**
- Dashboard asset list/detail: scan badge (Pending review / Clean / Blocked) next to the asset file.
- Upload flow: after upload, kick off `scan-asset-file` and show "Scanning…"; publishing is blocked while `infected`.
- Product page: purchase stays available but the download button shows the quarantine state if applicable.

## Prerequisite

A free VirusTotal API key (virustotal.com -> sign up -> API key in your profile). I'll request it securely when we start building.

## Notes / tradeoffs

- Hash lookups are instant and free; brand-new files need the byte upload path, which is capped at 32MB on the free tier. Larger archives will sit in `pending` for manual review rather than silently passing.
- This is a signature-based check, not a guarantee. Pairing it with a user "report file" action later is the practical complement — say the word and I'll include it.
