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

    // Test SendGrid API key
    try {
      const sendGridApiKey = Deno.env.get('API_KEY_FOR_FANREALMS_2FA')
      const senderEmail = Deno.env.get('SENDGRID_SENDER_EMAIL') || 'support@fanrealms.com'
      
      if (!sendGridApiKey) {
        console.error('❌ SendGrid API key not found')
        throw new Error('SendGrid API key not configured')
      }
      
      console.log('✅ SendGrid API key found, testing...')
      console.log(`📧 Using sender email: ${senderEmail}`)

      // SendGrid dynamic template payload
      const emailPayload = {
        personalizations: [
          {
            to: [{ email: email }],
            dynamic_template_data: {
              verification_code: code,
              user_email: email
            }
          }
        ],
        from: { email: senderEmail, name: "FanRealms Support" },
        template_id: "d-120a3ffb0c774da8ad484ab9010b673a"
      }

      // Test SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      })

      console.log(`📊 SendGrid response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ SendGrid API error: ${response.status} - ${errorText}`)
        
        // Return code as fallback with error details
        return new Response(
          JSON.stringify({ 
            success: true,
            message: `Email failed (${response.status}). Check console for code.`,
            devCode: code,
            error: `SendGrid error: ${response.status} - ${errorText.substring(0, 100)}`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ Email sent successfully via SendGrid!')
      
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
      console.error('❌ SendGrid error:', error)
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Email system error. Check console for code.',
          devCode: code,
          error: error.message
        }),
        { 
          status: 200, // Still return success so user can continue
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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