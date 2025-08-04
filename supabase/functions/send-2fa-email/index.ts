import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

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

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FanRealms <security@fanrealms.com>',
        to: [email],
        subject: 'Your FanRealms 2FA Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Verification Code</h2>
            <p style="color: #666; font-size: 16px;">Hi there,</p>
            <p style="color: #666; font-size: 16px;">
              You're signing in to your FanRealms account. Please use the verification code below:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="
                background: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                padding: 15px 25px;
                font-size: 24px;
                font-weight: bold;
                letter-spacing: 3px;
                color: #495057;
                display: inline-block;
              ">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The FanRealms Team
            </p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      console.error('Error sending email:', await emailResponse.text())
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