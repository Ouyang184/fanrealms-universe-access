import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!


async function sendEmail(to: string, code: string) {
  const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
  
  if (!sendGridApiKey) {
    throw new Error('Missing SendGrid API key')
  }

  console.log('📧 Preparing to send 2FA email');

  const emailPayload = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: "Your FanRealms Login Code"
      }
    ],
    from: { 
      email: Deno.env.get('SENDGRID_SENDER_EMAIL') || 'noreply@fanrealms.com',
      name: "FanRealms" 
    },
    content: [
      {
        type: "text/html",
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Your FanRealms Login Code</h1>
            <p style="font-size: 16px; color: #555; text-align: center;">
              Use this code to complete your login:
            </p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 4px;">
                ${code}
              </span>
            </div>
            <p style="font-size: 14px; color: #777; text-align: center;">
              This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
        `
      }
    ]
  }

  // 📧 SendGrid payload omitted for security

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailPayload)
  })

  console.log('📧 SendGrid response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('📧 SendGrid API error response:', errorText)
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`)
  }

  // 📧 SendGrid success response omitted
}

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
      await sendEmail(email, code)

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