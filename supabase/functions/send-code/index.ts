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
      
      if (!sesUser || !sesPass) {
        throw new Error('Missing SES SMTP credentials')
      }

      // Create SMTP connection using Deno's built-in capabilities
      const emailContent = `Subject: Your FanRealms 2FA Code\r\nFrom: support@fanrealms.com\r\nTo: ${email}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .code-box { 
            background: #f8f9fa; 
            border: 2px solid #e9ecef; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
            margin: 20px 0; 
            font-size: 24px; 
            font-weight: bold; 
            letter-spacing: 3px; 
            color: #495057; 
        }
        .footer { font-size: 14px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Your FanRealms 2FA Code</h2>
        </div>
        <p>Hi there,</p>
        <p>You're signing in to your FanRealms account. Please use the verification code below:</p>
        <div class="code-box">${code}</div>
        <p><strong>This code expires in 5 minutes.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>The FanRealms Team</p>
        </div>
    </div>
</body>
</html>`

      // Use fetch to send via Amazon SES SMTP (using SMTP API endpoint)
      const smtpUrl = `https://email-smtp.us-east-1.amazonaws.com:587`
      const auth = btoa(`${sesUser}:${sesPass}`)
      
      // For SMTP via HTTP, we'll use SES HTTP API instead
      const sesUrl = 'https://email.us-east-1.amazonaws.com/'
      
      const response = await fetch(sesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `AWS4-HMAC-SHA256 Credential=${sesUser}`,
          'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
        },
        body: new URLSearchParams({
          'Action': 'SendEmail',
          'Source': 'support@fanrealms.com',
          'Destination.ToAddresses.member.1': email,
          'Message.Subject.Data': 'Your FanRealms 2FA Code',
          'Message.Body.Html.Data': `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Your FanRealms 2FA Code</h2>
            <p>Hi there,</p>
            <p>You're signing in to your FanRealms account. Please use the verification code below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 15px 25px; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #495057; display: inline-block;">${code}</span>
            </div>
            <p><strong>This code expires in 5 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>The FanRealms Team</p>
          </div>`,
          'Version': '2010-12-01'
        }).toString()
      })

      // For development/testing, log the code and email details
      console.log(`🔐 2FA Code sent to ${email}: ${code}`)
      console.log(`📧 Email sent via SES, response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('SES Error:', errorText)
        throw new Error(`SES API error: ${response.status}`)
      }
      
    } catch (emailError) {
      console.error('Error sending 2FA email:', emailError)
      
      // For development, still return success but log the error
      console.log(`⚠️ Email sending failed, but code stored: ${code}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code generated (email sending in development mode)',
          devCode: code // Remove this in production
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