import { corsHeaders } from '../_shared/cors.ts'

interface Send2FAEmailRequest {
  email: string;
  code: string;
}

interface SendGridEmailData {
  personalizations: Array<{
    to: Array<{ email: string }>;
    dynamic_template_data: {
      subject: string;
      code: string;
    };
  }>;
  from: { email: string; name: string };
  template_id: string;
}

async function sendEmail(email: string, code: string) {
  const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
  
  if (!sendGridApiKey) {
    throw new Error('Missing SendGrid API key')
  }

  const emailData: SendGridEmailData = {
    personalizations: [
      {
        to: [{ email: email }],
        dynamic_template_data: {
          subject: 'Your FanRealms Login Code',
          code: code
        }
      }
    ],
    from: { 
      email: 'support@fanrealms.com', 
      name: 'FanRealms' 
    },
    template_id: 'd-120a3ffb0c774da8ad484ab9010b673a'
  }

  console.log('📧 Sending 2FA email');

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ SendGrid API error:', response.status, errorText)
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`)
  }

  console.log('✅ 2FA email sent successfully')
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code }: Send2FAEmailRequest = await req.json()
    
    // Validate inputs
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid code is required' }),
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

    console.log('📧 Processing 2FA email request')

    // Send email using SendGrid
    await sendEmail(email, code)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '2FA email sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in send-2fa-email function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send 2FA email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})