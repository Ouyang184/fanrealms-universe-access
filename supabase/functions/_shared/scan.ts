import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

export type ScanStatus = 'pending' | 'clean' | 'infected' | 'error' | 'unscannable'
export type ScanTable = 'digital_products' | 'product_versions'

// VirusTotal free tier caps direct file uploads at 32MB.
export const VT_UPLOAD_LIMIT = 32 * 1024 * 1024
const VT_BASE = 'https://www.virustotal.com/api/v3'

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface VtStats {
  malicious?: number
  suspicious?: number
  harmless?: number
  undetected?: number
}

function verdictFromStats(stats: VtStats): ScanStatus {
  const malicious = stats.malicious ?? 0
  const suspicious = stats.suspicious ?? 0
  if (malicious > 0 || suspicious > 2) return 'infected'
  return 'clean'
}

async function vtFetch(path: string, init?: RequestInit) {
  const apiKey = Deno.env.get('VIRUSTOTAL_API_KEY')
  if (!apiKey) throw new Error('VIRUSTOTAL_API_KEY is not configured')
  return await fetch(`${VT_BASE}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), 'x-apikey': apiKey },
  })
}

export interface ScanOutcome {
  status: ScanStatus
  verdict: Record<string, unknown>
  hash: string
}

/** Look up a file hash. Returns null when VirusTotal has never seen it. */
async function lookupHash(hash: string): Promise<ScanOutcome | null> {
  const res = await vtFetch(`/files/${hash}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`VirusTotal hash lookup failed: ${res.status}`)
  const body = await res.json()
  const stats: VtStats = body?.data?.attributes?.last_analysis_stats ?? {}
  return {
    status: verdictFromStats(stats),
    verdict: { source: 'hash', stats, scan_date: body?.data?.attributes?.last_analysis_date ?? null },
    hash,
  }
}

/** Upload the bytes and poll until VirusTotal returns an analysis verdict. */
async function uploadAndPoll(bytes: Uint8Array, filename: string, hash: string): Promise<ScanOutcome> {
  const form = new FormData()
  form.append('file', new Blob([bytes]), filename)
  const res = await vtFetch('/files', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`VirusTotal upload failed: ${res.status}`)
  const analysisId = (await res.json())?.data?.id
  if (!analysisId) throw new Error('VirusTotal upload returned no analysis id')

  // Poll for up to ~2 minutes; analyses of fresh files usually finish well inside that.
  for (let attempt = 0; attempt < 8; attempt++) {
    await new Promise((r) => setTimeout(r, 15_000))
    const poll = await vtFetch(`/analyses/${analysisId}`)
    if (!poll.ok) continue
    const body = await poll.json()
    if (body?.data?.attributes?.status === 'completed') {
      const stats: VtStats = body?.data?.attributes?.stats ?? {}
      return {
        status: verdictFromStats(stats),
        verdict: { source: 'upload', stats, analysis_id: analysisId },
        hash,
      }
    }
  }
  return { status: 'pending', verdict: { source: 'upload', analysis_id: analysisId, note: 'analysis still running' }, hash }
}

/** Download a file from private storage and scan it. */
export async function scanStorageObject(bucket: string, path: string): Promise<ScanOutcome> {
  const supabase = serviceClient()
  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error || !data) throw new Error(`Could not download ${bucket}/${path}: ${error?.message ?? 'not found'}`)

  const bytes = new Uint8Array(await data.arrayBuffer())
  const hash = await sha256Hex(bytes)

  const known = await lookupHash(hash)
  if (known) return known

  if (bytes.byteLength > VT_UPLOAD_LIMIT) {
    return {
      status: 'unscannable',
      verdict: {
        source: 'size',
        size: bytes.byteLength,
        note: 'File exceeds the 32MB scanner limit and needs manual review.',
      },
      hash,
    }
  }

  return await uploadAndPoll(bytes, path.split('/').pop() ?? 'asset', hash)
}

export async function recordScan(table: ScanTable, id: string, outcome: ScanOutcome) {
  const supabase = serviceClient()
  const { error } = await supabase
    .from(table)
    .update({
      scan_status: outcome.status,
      scan_verdict: outcome.verdict,
      scan_hash: outcome.hash,
      scanned_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(`Failed to record scan result: ${error.message}`)
}
