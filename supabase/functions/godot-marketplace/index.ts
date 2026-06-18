import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

const SIGNED_URL_TTL_SECONDS = 3600
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function basename(path: string | null): string {
  if (!path) return 'download'
  const parts = path.split('/')
  return parts[parts.length - 1] || 'download'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const svc = createClient(supabaseUrl, serviceKey)

    const body = await req.json().catch(() => null)
    const action = body?.action

    // ---- list ----
    if (action === 'list') {
      const { data, error } = await svc
        .from('digital_products')
        .select('id, title, short_description, cover_image_url, category, tags, updated_at, asset_file_path, asset_url, creator_id, price, status, engine')
        .eq('status', 'published')
        .eq('engine', 'Godot')
        .or('price.is.null,price.eq.0')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('list query error:', error)
        return json({ error: 'Failed to list assets' }, 500)
      }

      const rows = (data ?? []).filter((r: any) => r.asset_file_path || r.asset_url)
      const creatorIds = [...new Set(rows.map((r: any) => r.creator_id).filter(Boolean))]
      const creatorsById: Record<string, any> = {}
      if (creatorIds.length) {
        const { data: creators } = await svc
          .from('creators')
          .select('id, display_name, username, website')
          .in('id', creatorIds)
        for (const c of creators ?? []) creatorsById[c.id] = c
      }

      const assets = rows.map((r: any) => {
        const c = creatorsById[r.creator_id] ?? {}
        return {
          id: r.id,
          title: r.title,
          short_description: r.short_description ?? '',
          cover_image_url: r.cover_image_url ?? '',
          creator_name: c.display_name || c.username || 'Unknown',
          creator_url: c.website || '',
          file_name: r.asset_file_path ? basename(r.asset_file_path) : basename(r.asset_url),
          category: r.category ?? '',
          tags: r.tags ?? [],
          updated_at: r.updated_at,
        }
      })
      return json({ assets })
    }

    // ---- download ----
    if (action === 'download') {
      const assetId = body?.asset_id
      if (!assetId || !UUID_RE.test(assetId)) return json({ error: 'Invalid asset_id' }, 400)

      const { data: p, error } = await svc
        .from('digital_products')
        .select('id, price, status, engine, asset_file_path, asset_url')
        .eq('id', assetId)
        .maybeSingle()

      if (error || !p) return json({ error: 'Not found' }, 404)

      const price = parseFloat(String(p.price ?? '0'))
      const isFree = !isFinite(price) || price <= 0
      // Hard guard: never serve anything paid, unpublished, or non-Godot.
      if (p.status !== 'published' || p.engine !== 'Godot' || !isFree) {
        return json({ error: 'Asset not available' }, 403)
      }
      if (!p.asset_file_path && !p.asset_url) return json({ error: 'No download available' }, 404)

      if (!p.asset_file_path) {
        return json({ url: p.asset_url, file_name: basename(p.asset_url) })
      }

      const { data: signed, error: sErr } = await svc.storage
        .from('product-files')
        .createSignedUrl(p.asset_file_path, SIGNED_URL_TTL_SECONDS)
      if (sErr || !signed?.signedUrl) {
        console.error('createSignedUrl error:', sErr)
        return json({ error: 'Failed to generate download link' }, 500)
      }
      return json({ url: signed.signedUrl, file_name: basename(p.asset_file_path) })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    console.error('godot-marketplace error:', e)
    return json({ error: 'Internal server error' }, 500)
  }
})
