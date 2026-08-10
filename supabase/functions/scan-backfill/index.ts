import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { recordScan, scanStorageObject, serviceClient, type ScanTable } from '../_shared/scan.ts'

const BUCKET = 'product-files'
// VirusTotal free tier: 4 requests/minute. Space calls out generously.
const DELAY_MS = 20_000
const MAX_PER_RUN = 10

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Admin-only: caller must be an authenticated user with the admin role.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    )
    const { data: { user }, error: authError } = await anon.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const supabase = serviceClient()
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    if (!isAdmin) return json({ error: 'Forbidden' }, 403)

    const results: Array<{ table: ScanTable; id: string; status: string }> = []

    const { data: products } = await supabase
      .from('digital_products')
      .select('id, asset_file_path')
      .eq('scan_status', 'pending')
      .not('asset_file_path', 'is', null)
      .limit(MAX_PER_RUN)

    const { data: versions } = await supabase
      .from('product_versions')
      .select('id, file_path')
      .eq('scan_status', 'pending')
      .limit(MAX_PER_RUN)

    const queue: Array<{ table: ScanTable; id: string; path: string }> = [
      ...(products ?? []).map((p) => ({ table: 'digital_products' as const, id: p.id, path: p.asset_file_path! })),
      ...(versions ?? []).map((v) => ({ table: 'product_versions' as const, id: v.id, path: v.file_path })),
    ].slice(0, MAX_PER_RUN)

    for (const [index, item] of queue.entries()) {
      if (index > 0) await new Promise((r) => setTimeout(r, DELAY_MS))
      try {
        const outcome = await scanStorageObject(BUCKET, item.path)
        await recordScan(item.table, item.id, outcome)
        results.push({ table: item.table, id: item.id, status: outcome.status })
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        await recordScan(item.table, item.id, { status: 'error', verdict: { error: message }, hash: '' })
        results.push({ table: item.table, id: item.id, status: 'error' })
      }
    }

    return json({ scanned: results.length, results })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return json({ error: message }, 500)
  }
})
