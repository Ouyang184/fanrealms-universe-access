import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Turnstile secret (Cloudflare)
const TURNSTILE_SECRET = Deno.env.get('fanrealms_widget_secret_key') || Deno.env.get('TURNSTILE_SECRET_KEY') || '';

function getClientIP(req: Request): string {
  const h = req.headers;
  return h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || '0.0.0.0';
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // Secret not configured — skip (dev mode)
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(TURNSTILE_SECRET)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(ip)}`
    });
    const data = await resp.json();
    return !!data.success;
  } catch (e) {
    console.warn('Turnstile verification error:', e);
    return false;
  }
}

async function sendEmail(to: string, code: string) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) throw new Error('Missing Resend API key')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FanRealms <noreply@fanrealms.com>',
      to: [to],
      subject: 'Your FanRealms Login Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Your FanRealms Login Code</h1>
          <p style="font-size: 16px; color: #555; text-align: center;">Use this code to complete your login:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 4px;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #777; text-align: center;">
            This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend API error: ${response.status} - ${errorText}`)
  }
}

interface RequestBody {
  email: string;
  turnstileToken?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, turnstileToken }: RequestBody = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const ip = getClientIP(req);
    const windowMs = 15 * 60 * 1000;
    const since = new Date(Date.now() - windowMs).toISOString();

    const { count: ipCount } = await supabase
      .from('rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'send_code')
      .eq('ip', ip)
      .gte('created_at', since);

    const { count: emailCount } = await supabase
      .from('rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'send_code')
      .eq('email', email)
      .gte('created_at', since);

    const attempts = Math.max(ipCount ?? 0, emailCount ?? 0);
    if (attempts >= 5) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce Turnstile when secret is configured — reject if token missing
    if (TURNSTILE_SECRET) {
      if (!turnstileToken) {
        return new Response(
          JSON.stringify({ error: 'CAPTCHA token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const valid = await verifyTurnstile(turnstileToken, ip);
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'CAPTCHA verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Require proof of password authentication: an Authorization header with a valid
    // user session whose email matches. Prevents 2FA from being used as a passwordless
    // backdoor (the emailed code alone could otherwise sign a user in).
    const authHeader = req.headers.get('Authorization') || ''
    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required before requesting a 2FA code' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken)
    if (userErr || !userData?.user || (userData.user.email || '').toLowerCase() !== email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Invalid session for this email' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rngBuf = new Uint32Array(1)
    crypto.getRandomValues(rngBuf)
    const code = (100000 + (rngBuf[0] % 900000)).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('email_2fa_codes')
      .upsert({ email, code, expires_at: expiresAt })

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record a pending 2FA challenge — verify-code requires this row to exist,
    // gating session issuance behind the proven password sign-in above.
    await supabase
      .from('pending_2fa_challenges')
      .upsert({ email, expires_at: expiresAt })

    try {
      await sendEmail(email, code)
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send verification code. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('rate_limit_events').insert({ ip, email, action: 'send_code' });

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent to your email' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-code function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
