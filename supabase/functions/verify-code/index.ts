import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function getClientIP(req: Request): string {
  const h = req.headers;
  return h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || '0.0.0.0';
}
interface RequestBody {
  email: string;
  code: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code }: RequestBody = await req.json()
    
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Rate limit verification attempts: max 8 per 15 minutes by IP or email
    const ip = getClientIP(req);
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const since = new Date(Date.now() - windowMs).toISOString();

    const { count: ipCount } = await supabase
      .from('rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'verify_code')
      .eq('ip', ip)
      .gte('created_at', since);

    const { count: emailCount } = await supabase
      .from('rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'verify_code')
      .eq('email', email)
      .gte('created_at', since);

    const attempts = Math.max(ipCount ?? 0, emailCount ?? 0);
    if (attempts >= 8) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Check if code exists and is valid
    const { data: codeData, error: fetchError } = await supabase
      .from('email_2fa_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .single()

    if (fetchError || !codeData) {
      console.log(`Invalid 2FA verification attempt`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid verification code' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if code has expired
    const now = new Date()
    const expiresAt = new Date(codeData.expires_at)
    
    if (now > expiresAt) {
      console.log(`Expired 2FA verification attempt`)
      
      // Delete expired code
      await supabase
        .from('email_2fa_codes')
        .delete()
        .eq('email', email)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Verification code has expired' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Code is valid, delete it from database
    const { error: deleteError } = await supabase
      .from('email_2fa_codes')
      .delete()
      .eq('email', email)

    if (deleteError) {
      console.error('Error deleting 2FA code:', deleteError)
      // Still return success since verification was successful
    }

    console.log(`✅ Successful 2FA verification`)

    // Log successful verification attempt
    await supabase.from('rate_limit_events').insert({
      ip,
      email,
      action: 'verify_code'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification successful' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in verify-code function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})