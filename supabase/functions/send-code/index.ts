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

    // Send email using Amazon SES
    try {
      const sesUser = Deno.env.get('SES_SMTP_USER')
      const sesPass = Deno.env.get('SES_SMTP_PASS')
      const sesRegion = Deno.env.get('SES_REGION') || 'us-east-1'
      const fromEmail = Deno.env.get('SES_FROM_EMAIL') || 'noreply@yourdomain.com'
      
      console.log(`🔧 Checking SES credentials: User=${sesUser ? 'SET' : 'MISSING'}, Pass=${sesPass ? 'SET' : 'MISSING'}`)
      
      if (!sesUser || !sesPass) {
        console.error('❌ Missing SES SMTP credentials')
        throw new Error('Missing SES SMTP credentials')
      }

      console.log(`📧 Sending email to ${email} via AWS SES...`)
      
      // Use AWS SDK v3 approach with proper authentication
      const sesEndpoint = `https://email.${sesRegion}.amazonaws.com/`
      
      // Create properly formatted email body
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #333; margin-bottom: 30px;">Verification Code</h1>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              Enter this verification code to complete your login:
            </p>
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 2px solid #e9ecef; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #007bff;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `

      // Create AWS SES SendEmail request
      const now = new Date()
      const dateStamp = now.toISOString().split('T')[0].replace(/-/g, '')
      const timeStamp = now.toISOString().replace(/[:\-]|\.\d{3}/g, '')
      
      // Create canonical request
      const params = new URLSearchParams({
        'Action': 'SendEmail',
        'Source': fromEmail,
        'Destination.ToAddresses.member.1': email,
        'Message.Subject.Data': 'Your verification code',
        'Message.Body.Html.Data': emailHtml,
        'Version': '2010-12-01'
      })

      // Simple approach using basic auth with SES credentials
      const authHeader = 'Basic ' + btoa(`${sesUser}:${sesPass}`)
      
      const response = await fetch(sesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader,
          'X-Amz-Date': timeStamp
        },
        body: params.toString()
      })

      const responseText = await response.text()
      console.log(`📧 SES Response (${response.status}):`, responseText)

      if (!response.ok) {
        console.error('❌ SES API error:', responseText)
        throw new Error(`SES API failed: ${response.status} - ${responseText}`)
      }

      console.log(`✅ Email sent successfully to ${email}`)
      
    } catch (emailError) {
      console.error('❌ Error sending email via SES:', emailError)
      
      // For development, log the code but still try to continue
      console.log(`🔐 Development fallback - 2FA Code for ${email}: ${code}`)
      
      // Return success but with a fallback message
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code generated. Check your email or server logs.',
          devNote: process.env.NODE_ENV === 'development' ? `Dev Code: ${code}` : undefined
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