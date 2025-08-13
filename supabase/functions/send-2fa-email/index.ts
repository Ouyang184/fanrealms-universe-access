import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase service client for rate limiting
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


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

    // Redact email for logs
    const redact = (e: string) => e.replace(/(.{2}).+(@.+)/, '$1***$2')
    console.log('📧 Processing 2FA email request for', redact(email))

    // Require API key for this endpoint
    const providedKey = req.headers.get('x-2fa-api-key') || req.headers.get('x-api-key')
    const expectedKey = Deno.env.get('API_KEY_FOR_FANREALMS_2FA') || ''
    if (!expectedKey || providedKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Basic rate limiting by IP and email over 10 minutes
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      'unknown'

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const maxPerEmail = 3
    const maxPerIp = 10

    const [{ count: emailCount, error: emailCountError }, { count: ipCount, error: ipCountError }] = await Promise.all([
      supabase
        .from('rate_limit_events')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'send_2fa_email')
        .eq('email', email)
        .gte('created_at', tenMinutesAgo),
      supabase
        .from('rate_limit_events')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'send_2fa_email')
        .eq('ip', clientIp)
        .gte('created_at', tenMinutesAgo),
    ])

    if (emailCountError || ipCountError) {
      console.warn('⚠️ Rate limit count error', { emailCountError, ipCountError })
    } else {
      if ((emailCount ?? 0) >= maxPerEmail || (ipCount ?? 0) >= maxPerIp) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Send email using SendGrid
    await sendEmail(email, code)

    // Record rate limit event
    const { error: insertError } = await supabase.from('rate_limit_events').insert({
      ip: clientIp,
      action: 'send_2fa_email',
      email,
    })
    if (insertError) {
      console.warn('⚠️ Failed to record rate limit event', insertError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '2FA email sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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