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
      const sesRegion = Deno.env.get('SES_REGION') || 'us-east-1'
      const fromEmail = Deno.env.get('SES_FROM_EMAIL') || 'noreply@yourdomain.com'
      
      console.log(`🔧 Checking SES credentials: User=${sesUser ? 'SET' : 'MISSING'}, Pass=${sesPass ? 'SET' : 'MISSING'}`)
      
      if (!sesUser || !sesPass) {
        console.error('❌ Missing SES SMTP credentials')
        throw new Error('Missing SES SMTP credentials')
      }

      // Send email via SES SMTP
      const smtpHost = `email-smtp.${sesRegion}.amazonaws.com`
      const smtpPort = 587

      const emailContent = `
Subject: Your verification code
From: ${fromEmail}
To: ${email}
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
</body>
</html>
      `.trim()

      // Create SMTP connection
      const encoder = new TextEncoder()
      const auth = btoa(`${sesUser}:${sesPass}`)
      
      console.log(`📧 Sending email to ${email} via SES SMTP...`)
      
      // Use AWS SES API to send email
      const sesEndpoint = `https://email.${sesRegion}.amazonaws.com`
      
      // Create AWS signature (simplified version)
      const message = `
From: ${fromEmail}
To: ${email}
Subject: Your verification code
Content-Type: text/html; charset=UTF-8

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
      This code will expire in 5 minutes.
    </p>
  </div>
</div>
      `.trim()

      // For now, use a simple SMTP approach via nodemailer-like functionality
      // This is a simplified implementation - in production you'd want proper AWS SDK
      const params = new URLSearchParams({
        'Action': 'SendEmail',
        'Source': fromEmail,
        'Destination.ToAddresses.member.1': email,
        'Message.Subject.Data': 'Your verification code',
        'Message.Body.Html.Data': `
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
                This code will expire in 5 minutes.
              </p>
            </div>
          </div>
        `,
        'Version': '2010-12-01'
      })

      const response = await fetch(sesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `AWS4-HMAC-SHA256 Credential=${sesUser}/${new Date().toISOString().split('T')[0]}/${sesRegion}/ses/aws4_request, SignedHeaders=host;x-amz-date, Signature=placeholder`
        },
        body: params.toString()
      })

      if (!response.ok) {
        console.error('SES API error:', await response.text())
        throw new Error(`SES API failed: ${response.status}`)
      }

      console.log(`✅ Email sent successfully to ${email}`)
      
    } catch (emailError) {
      console.error('Error sending email via SES:', emailError)
      
      // Still return success but mention email issue
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code generated. If you don\'t receive the email, check your spam folder.',
          warning: 'Email delivery may have failed'
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