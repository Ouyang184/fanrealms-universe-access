import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SendEmailParams {
  templateId: string;
  to: string;
  from: string;
  dynamic_template_data: Record<string, any>;
}

async function sendEmail({ templateId, to, from, dynamic_template_data }: SendEmailParams) {
  const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
  
  if (!sendGridApiKey) {
    throw new Error('Missing SendGrid API key')
  }

  const emailPayload = {
    personalizations: [
      {
        to: [{ email: to }],
        dynamic_template_data
      }
    ],
    from: { email: from, name: "FanRealms" },
    template_id: templateId
  }

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
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`)
  }
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
      await sendEmail({
        templateId: 'd-120a3ffb0c774da8ad484ab9010b673a',
        to: email,
        from: 'support@fanrealms.com',
        dynamic_template_data: {
          subject: 'Your FanRealms Login Code',
          code: code
        }
      })

      console.log('📧 2FA email sent successfully via SendGrid dynamic template')
      
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