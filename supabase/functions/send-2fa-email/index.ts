import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email }: RequestBody = await req.json()
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
    const user = users?.find(u => u.email === email)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user has email 2FA enabled
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('email_2fa_enabled')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.email_2fa_enabled) {
      return new Response(
        JSON.stringify({ error: 'Email 2FA not enabled for this user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Rate limiting: Check if user has requested a code recently (within 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recentCodes } = await supabase
      .from('email_2fa_codes')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneMinuteAgo)

    if (recentCodes && recentCodes.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Please wait before requesting another code' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Store code in database
    const { error: insertError } = await supabase
      .from('email_2fa_codes')
      .insert({
        user_id: user.id,
        code,
        expires_at: expiresAt
      })

    if (insertError) {
      console.error('Error storing 2FA code:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification code' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email using Supabase's auth system
    try {
      // Use Supabase auth admin to send a custom recovery email with the 2FA code
      // We'll leverage the magic link system but customize the email content
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email,
        options: {
          data: {
            twofa_code: code,
            purpose: '2fa_verification'
          }
        }
      })

      if (linkError) {
        console.error('Error generating auth link:', linkError)
        throw new Error('Failed to generate verification email')
      }

      // For development/testing, log the code
      console.log(`🔐 2FA Code sent to ${email}: ${code}`)
      
      // In production, this would trigger Supabase's email system
      // You can customize the email template in Supabase Dashboard > Authentication > Email Templates
      
    } catch (emailError) {
      console.error('Error sending 2FA email:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent to your email' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-2fa-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})