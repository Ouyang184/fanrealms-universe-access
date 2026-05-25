
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

    const ALLOWED_ORIGINS = [
      'https://fanrealms.com',
      'https://www.fanrealms.com',
      'https://fanrealms-universe-access.lovable.app',
    ];
    const reqOrigin = req.headers.get('Origin') ?? req.headers.get('origin') ?? '';
    const origin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : 'https://fanrealms.com';
    console.log('Origin:', origin)
    console.log('Action:', action)

    const jsonOk = (body: unknown) =>
      new Response(JSON.stringify(body), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    const jsonErr = (msg: string, status = 400) =>
      new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

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
        refresh_url: `${origin}/settings`,
        return_url: `${origin}/dashboard?stripe_success=true`,
        type: 'account_onboarding',
      })

      console.log('Account link created:', accountLink.url)

      return new Response(JSON.stringify({
        onboardingUrl: accountLink.url
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      }

      case 'create_login_link': {
      // SECURITY: Resolve the caller's own creator profile and use ITS stripe_account_id.
      // Never trust client-supplied accountId for privileged actions.
      const callerCreatorId = await verifyCreatorAccess(supabaseService, user.id);
      const { data: callerCreator, error: callerCreatorErr } = await supabaseService
        .from('creators')
        .select('stripe_account_id')
        .eq('id', callerCreatorId)
        .single();

      if (callerCreatorErr || !callerCreator?.stripe_account_id) {
        logSecurityEvent('STRIPE_ACCOUNT_MISSING', { creatorId: callerCreatorId }, user.id);
        return new Response(JSON.stringify({ error: 'No Stripe account found for this creator' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const ownedAccountId = callerCreator.stripe_account_id;

      console.log('Creating login link for account:', ownedAccountId)
      
      // Check if account has completed onboarding
      const account = await stripe.accounts.retrieve(ownedAccountId)
      
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
      const loginLink = await stripe.accounts.createLoginLink(ownedAccountId)
      console.log('Login link created:', loginLink.url)

      return new Response(JSON.stringify({ 
        loginUrl: loginLink.url 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      }

      case 'get_balance': {
      // SECURITY: Look up the caller's own stripe_account_id from the database.
      const balanceCreatorId = await verifyCreatorAccess(supabaseService, user.id);
      const { data: balanceCreator, error: balanceCreatorErr } = await supabaseService
        .from('creators')
        .select('stripe_account_id')
        .eq('id', balanceCreatorId)
        .single();

      if (balanceCreatorErr || !balanceCreator?.stripe_account_id) {
        logSecurityEvent('STRIPE_ACCOUNT_MISSING', { creatorId: balanceCreatorId }, user.id);
        return new Response(JSON.stringify({ error: 'No Stripe account found for this creator' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const ownedBalanceAccountId = balanceCreator.stripe_account_id;

      console.log('Getting balance for account:', ownedBalanceAccountId)
      
      // Get account balance
      const balance = await stripe.balance.retrieve({
        stripeAccount: ownedBalanceAccountId,
      })

      return new Response(JSON.stringify({ balance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      }

      case 'transfer_pending_earnings': {
        // Resolve the caller's creator id from their user session
        const transferCreatorId = await verifyCreatorAccess(supabaseService, user.id);

        // Get their Stripe account id from the database (from creators table)
        const { data: transferCreator } = await supabaseService
          .from('creators')
          .select('stripe_account_id')
          .eq('id', transferCreatorId)
          .single();

        if (!transferCreator?.stripe_account_id) {
          return jsonErr('No Stripe account connected', 400);
        }

        // Fetch all pending marketplace earnings for this creator
        const { data: pendingEarnings, error: pendingErr } = await supabaseService
          .from('creator_earnings')
          .select('id, net_amount')
          .eq('creator_id', transferCreatorId)
          .eq('status', 'pending');

        if (pendingErr) throw pendingErr;

        if (!pendingEarnings || pendingEarnings.length === 0) {
          return jsonOk({ transferred: 0, amount: 0 });
        }

        const totalCents = Math.round(
          pendingEarnings.reduce((sum, e) => sum + Number(e.net_amount), 0) * 100
        );

        // Stripe minimum transfer is $1.00 (100 cents)
        if (totalCents < 100) {
          return jsonOk({ transferred: 0, amount: 0, reason: 'Below $1.00 minimum' });
        }

        // Mark all pending earnings as transferred
        const earningIds = pendingEarnings.map((e) => e.id);

        // Create the Stripe transfer from platform account to creator's account
        // Deterministic idempotency key based on creator + sorted earning IDs
        // prevents double-transfer if two requests fire concurrently
        const idempotencyKey = `transfer-${transferCreatorId}-${earningIds.sort().join('-')}`.slice(0, 255);

        const transfer = await stripe.transfers.create(
          {
            amount: totalCents,
            currency: 'usd',
            destination: transferCreator.stripe_account_id,
            description: `FanRealms pending earnings — ${pendingEarnings.length} sale(s)`,
          },
          { idempotencyKey }
        );
        const { error: updateErr } = await supabaseService
          .from('creator_earnings')
          .update({ status: 'transferred', stripe_transfer_id: transfer.id })
          .in('id', earningIds);

        if (updateErr) {
          console.error('[stripe-connect] Failed to update earnings status after transfer:', updateErr);
          // Transfer succeeded — log error but don't fail the response
        }

        logSecurityEvent('PENDING_EARNINGS_TRANSFERRED', {
          creatorId: transferCreatorId,
          count: pendingEarnings.length,
          totalCents,
        }, user.id);

        return jsonOk({
          transferred: pendingEarnings.length,
          amount: totalCents / 100,
          transferId: transfer.id,
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Stripe Connect error:', error)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
