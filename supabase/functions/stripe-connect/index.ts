
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, creatorId, accountId } = await req.json()
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE') || Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key')
      return new Response(JSON.stringify({ error: 'Missing Stripe configuration' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const origin = req.headers.get('origin') || 'http://localhost:3000'
    console.log('Origin:', origin)
    console.log('Action:', action)

    if (action === 'create_account') {
      console.log('Creating account for creator:', creatorId)
      
      // First check if creator already has a Stripe account
      const { data: existingCreator, error: fetchError } = await supabase
        .from('creators')
        .select('stripe_account_id')
        .eq('id', creatorId)
        .single()

      if (fetchError) {
        console.error('Error fetching creator:', fetchError)
        return new Response(JSON.stringify({ error: 'Creator not found' }), { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      let accountId = existingCreator.stripe_account_id

      // Validate existing account against current environment (live/test)
      if (accountId) {
        try {
          console.log('Validating existing Stripe account in current environment:', accountId)
          await stripe.accounts.retrieve(accountId)
          console.log('Existing account is valid in current environment')
        } catch (e) {
          console.warn('Existing account not found in current environment, will create a new one:', {
            accountId,
            message: (e as any)?.message,
            type: (e as any)?.type,
            code: (e as any)?.code,
          })
          accountId = undefined as unknown as string
        }
      }

      // Create new account if none exists or invalid for this environment
      if (!accountId) {
        console.log('Creating new Stripe account')
        const account = await stripe.accounts.create({
          type: 'express',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        })

        accountId = account.id
        console.log('Created account:', accountId)

        // Update creator with Stripe account ID
        const { error: updateError } = await supabase
          .from('creators')
          .update({ stripe_account_id: accountId })
          .eq('id', creatorId)

        if (updateError) {
          console.error('Error updating creator:', updateError)
          return new Response(JSON.stringify({ error: 'Database error' }), { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // Create account link for onboarding
      console.log('Creating account link for:', accountId)
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/creator-studio/settings?stripe_refresh=true`,
        return_url: `${origin}/creator-studio/settings?stripe_success=true`,
        type: 'account_onboarding',
      })

      console.log('Account link created:', accountLink.url)

      return new Response(JSON.stringify({ 
        accountId: accountId,
        onboardingUrl: accountLink.url 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (action === 'create_login_link') {
      console.log('Creating login link for account:', accountId)
      
      // Check if account has completed onboarding
      const account = await stripe.accounts.retrieve(accountId)
      
      if (!account.charges_enabled || !account.details_submitted) {
        console.error('Account has not completed onboarding')
        return new Response(JSON.stringify({ 
          error: 'Account onboarding not complete. Please complete onboarding first.' 
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create login link for existing account
      const loginLink = await stripe.accounts.createLoginLink(accountId)
      console.log('Login link created:', loginLink.url)

      return new Response(JSON.stringify({ 
        loginUrl: loginLink.url 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (action === 'get_balance') {
      console.log('Getting balance for account:', accountId)
      
      // Get account balance
      const balance = await stripe.balance.retrieve({
        stripeAccount: accountId,
      })

      return new Response(JSON.stringify({ balance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Stripe Connect error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
