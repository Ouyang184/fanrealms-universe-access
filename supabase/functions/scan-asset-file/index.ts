import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { recordScan, scanStorageObject, serviceClient, type ScanTable } from '../_shared/scan.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BUCKET = 'product-files'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const internalSecret = req.headers.get('x-internal-secret')
    const isInternal =
      !!internalSecret && internalSecret === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    let userId: string | null = null
    if (!isInternal) {
      if (!authHeader) return json({ error: 'Unauthorized' }, 401)
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
      const anon = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: `Bearer ${token}` } } },
      )
      const { data: { user }, error } = await anon.auth.getUser()
      if (error || !user) return json({ error: 'Unauthorized' }, 401)
      userId = user.id
    }

    const body = await req.json().catch(() => null)
    const table: ScanTable | undefined = body?.table
    const id: string | undefined = body?.id
    if (table !== 'digital_products' && table !== 'product_versions') {
      return json({ error: 'Invalid table' }, 400)
    }
    if (!id || !UUID_RE.test(id)) return json({ error: 'Invalid id' }, 400)

    const supabase = serviceClient()

    // Resolve the storage path and confirm ownership for non-internal callers.
    let path: string | null = null
    let ownerUserId: string | null = null

    if (table === 'digital_products') {
      const { data } = await supabase
        .from('digital_products')
        .select('asset_file_path, creators!inner(user_id)')
        .eq('id', id)
        .maybeSingle()
      if (!data) return json({ error: 'Not found' }, 404)
      path = data.asset_file_path
      ownerUserId = (data as any).creators?.user_id ?? null
    } else {
      const { data } = await supabase
        .from('product_versions')
        .select('file_path, digital_products!inner(creators!inner(user_id))')
        .eq('id', id)
        .maybeSingle()
      if (!data) return json({ error: 'Not found' }, 404)
      path = data.file_path
      ownerUserId = (data as any).digital_products?.creators?.user_id ?? null
    }

    if (!isInternal && userId !== ownerUserId) {
      return json({ error: 'Forbidden' }, 403)
    }

    if (!path) {
      await recordScan(table, id, { status: 'clean', verdict: { source: 'none', note: 'no file to scan' }, hash: '' })
      return json({ status: 'clean' })
    }

    try {
      const outcome = await scanStorageObject(BUCKET, path)
      await recordScan(table, id, outcome)
      return json({ status: outcome.status, verdict: outcome.verdict })
    } catch (scanError) {
      const message = scanError instanceof Error ? scanError.message : String(scanError)
      await recordScan(table, id, { status: 'error', verdict: { error: message }, hash: '' })
      return json({ status: 'error', error: message }, 200)
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return json({ error: message }, 500)
  }
})
