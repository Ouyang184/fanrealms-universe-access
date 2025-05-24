
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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      return new Response('Missing Stripe configuration', { status: 500 })
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'create_account') {
      // Create Stripe Express account
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      // Update creator with Stripe account ID
      const { error } = await supabase
        .from('creators')
        .update({ stripe_account_id: account.id })
        .eq('id', creatorId)

      if (error) {
        console.error('Error updating creator:', error)
        return new Response('Database error', { status: 500 })
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.headers.get('origin')}/creator-studio/settings?refresh=true`,
        return_url: `${req.headers.get('origin')}/creator-studio/settings?success=true`,
        type: 'account_onboarding',
      })

      return new Response(JSON.stringify({ 
        accountId: account.id,
        onboardingUrl: accountLink.url 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (action === 'create_login_link') {
      // Create login link for existing account
      const loginLink = await stripe.accounts.createLoginLink(accountId)

      return new Response(JSON.stringify({ 
        loginUrl: loginLink.url 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (action === 'get_balance') {
      // Get account balance
      const balance = await stripe.balance.retrieve({
        stripeAccount: accountId,
      })

      return new Response(JSON.stringify({ balance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Invalid action', { status: 400 })

  } catch (error) {
    console.error('Stripe Connect error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
