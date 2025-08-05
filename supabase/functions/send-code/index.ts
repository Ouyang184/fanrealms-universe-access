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

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // Store/update code in database (upsert)
    const { error: insertError } = await supabase
      .from('email_2fa_codes')
      .upsert({
        email,
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

    // Send email using SendGrid
    try {
      const sendGridApiKey = Deno.env.get('API_KEY_FOR_FANREALMS_2FA')
      
      if (!sendGridApiKey) {
        console.error('❌ Missing SendGrid API key')
        throw new Error('Missing SendGrid API key')
      }

      console.log(`🔐 2FA Code generated for ${email}: ${code}`)
      
      // SendGrid email payload
      const emailPayload = {
        personalizations: [
          {
            to: [{ email: email }],
            subject: "Your FanRealms 2FA Verification Code"
          }
        ],
        from: { email: "support@fanrealms.com", name: "FanRealms" },
        content: [
          {
            type: "text/html",
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #333; margin-bottom: 10px;">FanRealms</h1>
                  <h2 style="color: #666; font-weight: normal;">Two-Factor Authentication</h2>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 20px;">
                  <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                    Your verification code is:
                  </p>
                  <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; margin: 20px 0;">
                    ${code}
                  </div>
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    This code will expire in 5 minutes.
                  </p>
                </div>
                
                <div style="text-align: center; color: #666; font-size: 14px;">
                  <p>If you didn't request this code, please ignore this email.</p>
                  <p style="margin-top: 20px;">
                    <strong>FanRealms Team</strong>
                  </p>
                </div>
              </div>
            `
          }
        ]
      }

      // Send email via SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('SendGrid API error:', response.status, errorText)
        throw new Error(`SendGrid API error: ${response.status}`)
      }

      console.log('📧 2FA email sent successfully via SendGrid')
      
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send verification code. Please try again.' 
        }),
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
    console.error('Error in send-code function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})