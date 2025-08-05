import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    // Check if code exists and is valid
    const { data: codeData, error: fetchError } = await supabase
      .from('email_2fa_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .single()

    if (fetchError || !codeData) {
      console.log(`Invalid code attempt for ${email}: ${code}`)
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
      console.log(`Expired code attempt for ${email}: ${code}`)
      
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

    console.log(`✅ Successful 2FA verification for ${email}`)

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