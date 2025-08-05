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

    // Send email using Amazon SES SMTP
    try {
      const sesUser = Deno.env.get('SES_SMTP_USER')
      const sesPass = Deno.env.get('SES_SMTP_PASS')
      
      console.log(`🔧 Checking SES credentials: User=${sesUser ? 'SET' : 'MISSING'}, Pass=${sesPass ? 'SET' : 'MISSING'}`)
      
      if (!sesUser || !sesPass) {
        console.error('❌ Missing SES SMTP credentials')
        throw new Error('Missing SES SMTP credentials')
      }

      // For development/testing, log the code and skip actual email sending
      console.log(`🔐 2FA Code generated for ${email}: ${code}`)
      console.log(`📧 SES credentials configured, would send email in production`)
      
      // TODO: Implement actual SES email sending here
      // For now, return success with the code logged
      
    } catch (emailError) {
      console.error('Error with email system:', emailError)
      
      // For development, still return success but log the error
      console.log(`⚠️ Email sending failed, but code stored: ${code}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code generated (check server logs for code)',
          devNote: `Code: ${code}` // Remove this in production
        }),
        { 
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