import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify caller's JWT
    const anonClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const product_id: string | undefined = body?.product_id
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: 'product_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseService)

    // Fetch product (service role so we always get the row regardless of RLS)
    const { data: product, error: productError } = await serviceClient
      .from('digital_products')
      .select('id, price, asset_file_path, asset_url, status')
      .eq('id', product_id)
      .maybeSingle()

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (product.status !== 'published') {
      return new Response(
        JSON.stringify({ error: 'Product not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No file in Storage — fall back to external URL
    if (!product.asset_file_path) {
      if (!product.asset_url) {
        return new Response(
          JSON.stringify({ error: 'No download available for this product' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ url: product.asset_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For paid products, verify the caller has a completed purchase
    if (Number(product.price) > 0) {
      const { data: purchase } = await serviceClient
        .from('purchases')
        .select('id')
        .eq('product_id', product_id)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .maybeSingle()

      if (!purchase) {
        return new Response(
          JSON.stringify({ error: 'Purchase required to download this asset' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate 1-hour signed URL using service role
    const { data: signedData, error: signedError } = await serviceClient.storage
      .from('product-files')
      .createSignedUrl(product.asset_file_path, 3600)

    if (signedError || !signedData?.signedUrl) {
      console.error('createSignedUrl error:', signedError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate download link. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ url: signedData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('get-download-url error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
