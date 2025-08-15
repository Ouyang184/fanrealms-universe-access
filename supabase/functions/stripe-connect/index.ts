
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security logging function
const logSecurityEvent = (eventType: string, details: any, userId?: string) => {
  console.log(`🔒 SECURITY [${eventType}]:`, {
    timestamp: new Date().toISOString(),
    userId,
    ...details
  });
};

// Authentication verification function
const verifyUserAuthentication = async (req: Request, supabase: any) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    logSecurityEvent('AUTH_MISSING', { endpoint: 'stripe-connect' });
    throw new Error('Authorization header required');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    logSecurityEvent('AUTH_FAILED', { error: error?.message, endpoint: 'stripe-connect' });
    throw new Error(`Authentication failed: ${error?.message || 'User not found'}`);
  }

  logSecurityEvent('AUTH_SUCCESS', { userId: user.id, endpoint: 'stripe-connect' }, user.id);
  return user;
};

// Verify creator ownership
const verifyCreatorAccess = async (supabase: any, userId: string, creatorId?: string) => {
  if (!creatorId) {
    const { data: creator, error } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (error || !creator) {
      logSecurityEvent('CREATOR_ACCESS_DENIED', { userId, reason: 'No creator profile found' }, userId);
      throw new Error('Creator profile not found');
    }
    
    return creator.id;
  }

  // Verify user owns the specified creator profile
  const { data: creator, error } = await supabase
    .from('creators')
    .select('id')
    .eq('id', creatorId)
    .eq('user_id', userId)
    .single();

  if (error || !creator) {
    logSecurityEvent('CREATOR_ACCESS_DENIED', { userId, creatorId, reason: 'Unauthorized creator access' }, userId);
    throw new Error('Unauthorized access to creator profile');
  }

  return creatorId;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logSecurityEvent('REQUEST_START', { 
      method: req.method, 
      url: req.url,
      userAgent: req.headers.get('User-Agent'),
      origin: req.headers.get('Origin')
    });

    // Initialize Supabase with service role for secure operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Initialize Supabase with anon key for user authentication
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user authentication
    const user = await verifyUserAuthentication(req, supabaseAnon);

    const { action, creatorId, accountId } = await req.json();
    logSecurityEvent('ACTION_REQUEST', { action, creatorId, accountId }, user.id);
    // Verify Stripe configuration
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      logSecurityEvent('STRIPE_CONFIG_ERROR', { reason: 'Missing secret key' }, user.id);
      throw new Error('Stripe configuration error');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const origin = req.headers.get('origin') || 'http://localhost:3000'
    console.log('Origin:', origin)
    console.log('Action:', action)

    switch (action) {
      case 'create_account': {
        // Verify creator access
        const validCreatorId = await verifyCreatorAccess(supabaseService, user.id, creatorId);
        
        // Check if account already exists
        const { data: existingCreator } = await supabaseService
          .from('creators')
          .select('stripe_account_id')
          .eq('id', validCreatorId)
          .single();

        if (existingCreator?.stripe_account_id) {
          logSecurityEvent('ACCOUNT_EXISTS', { creatorId: validCreatorId, accountId: existingCreator.stripe_account_id }, user.id);
        }

        let accountId = existingCreator?.stripe_account_id

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
        const { error: updateError } = await supabaseService
          .from('creators')
          .update({ stripe_account_id: accountId })
          .eq('id', validCreatorId)

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
      }

      case 'create_login_link': {
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
      }

      case 'get_balance': {
      console.log('Getting balance for account:', accountId)
      
      // Get account balance
      const balance = await stripe.balance.retrieve({
        stripeAccount: accountId,
      })

      return new Response(JSON.stringify({ balance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      }
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
