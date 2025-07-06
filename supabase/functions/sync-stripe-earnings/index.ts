
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
    console.log('Manual sync earnings function called (TEST MODE)');

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('ERROR: Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('ERROR: User authentication failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User authenticated:', user.id);

    // Get creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (creatorError || !creator || !creator.stripe_account_id) {
      console.log('ERROR: Creator not found or no Stripe account:', creatorError);
      return new Response(JSON.stringify({ error: 'Creator not found or Stripe not connected' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Creator found:', creator.id, 'Stripe Account:', creator.stripe_account_id);

    // Use TEST Stripe secret key for earnings sync
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_TEST')
    if (!stripeSecretKey) {
      console.log('ERROR: Missing Stripe test secret key');
      return new Response(JSON.stringify({ error: 'Missing Stripe test configuration' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
    const supabaseService = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Update Stripe Connect account status
    console.log('Fetching Stripe account details for:', creator.stripe_account_id, '(TEST MODE)');
    let accountUpdateSuccess = false;
    
    try {
      const account = await stripe.accounts.retrieve(creator.stripe_account_id);
      console.log('Account details retrieved (TEST MODE):', {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      });

      const { error: updateError } = await supabaseService
        .from('creators')
        .update({
          stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
        })
        .eq('id', creator.id);

      if (updateError) {
        console.error('Error updating creator account status:', updateError);
      } else {
        console.log('Successfully updated creator account status (TEST MODE)');
        accountUpdateSuccess = true;
      }
    } catch (accountError) {
      console.error('Error fetching/updating Stripe account (TEST MODE):', accountError);
    }

    // Sync earnings from both Payment Intents and Checkout Sessions
    console.log('Fetching charges from Stripe (TEST MODE)...');
    const charges = await stripe.charges.list({
      limit: 50, // Get last 50 charges
      stripeAccount: creator.stripe_account_id
    });

    console.log('Fetching checkout sessions from Stripe (TEST MODE)...');
    const checkoutSessions = await stripe.checkout.sessions.list({
      limit: 50, // Get last 50 sessions
      stripeAccount: creator.stripe_account_id
    });

    console.log(`Found ${charges.data.length} charges and ${checkoutSessions.data.length} checkout sessions (TEST MODE)`);

    let syncedCount = 0;
    let commissionCount = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Process charges (existing logic)
    for (const charge of charges.data) {
      if (!charge.paid || charge.amount <= 0) continue;
      
      const chargeDate = new Date(charge.created * 1000);
      if (chargeDate < thirtyDaysAgo) continue;

      const amount = charge.amount / 100;
      const isCommission = charge.metadata?.type === 'commission_payment';
      const platformFee = isCommission ? amount * 0.04 : amount * 0.05;
      const netAmount = amount - platformFee;
      const earningType = isCommission ? 'commission' : 'subscription';

      // Check if we already have this earning recorded
      const { data: existingEarning } = await supabaseService
        .from('creator_earnings')
        .select('id')
        .eq('creator_id', creator.id)
        .eq('stripe_transfer_id', charge.id)
        .single();

      if (!existingEarning) {
        const { error: insertError } = await supabaseService
          .from('creator_earnings')
          .insert({
            creator_id: creator.id,
            amount: amount,
            platform_fee: platformFee,
            net_amount: netAmount,
            stripe_transfer_id: charge.id,
            payment_date: chargeDate.toISOString(),
            earning_type: earningType,
            commission_id: charge.metadata?.commission_request_id || null
          });

        if (insertError) {
          console.error('Error inserting earning from charge (TEST MODE):', insertError);
        } else {
          syncedCount++;
          if (isCommission) commissionCount++;
          console.log(`Synced ${earningType} charge (TEST MODE): ${charge.id} - $${amount}`);
        }
      }
    }

    // Process checkout sessions (new logic for commissions)
    for (const session of checkoutSessions.data) {
      if (session.payment_status !== 'paid' || !session.amount_total || session.amount_total <= 0) continue;
      
      const sessionDate = new Date(session.created * 1000);
      if (sessionDate < thirtyDaysAgo) continue;

      // Only process commission checkout sessions
      const isCommission = session.metadata?.type === 'commission_payment';
      if (!isCommission) continue;

      const amount = session.amount_total / 100;
      const platformFee = amount * 0.04; // 4% for commissions
      const netAmount = amount - platformFee;

      // Check if we already have this earning recorded
      const { data: existingEarning } = await supabaseService
        .from('creator_earnings')
        .select('id')
        .eq('creator_id', creator.id)
        .eq('stripe_transfer_id', session.id)
        .single();

      if (!existingEarning) {
        const { error: insertError } = await supabaseService
          .from('creator_earnings')
          .insert({
            creator_id: creator.id,
            amount: amount,
            platform_fee: platformFee,
            net_amount: netAmount,
            stripe_transfer_id: session.id,
            payment_date: sessionDate.toISOString(),
            earning_type: 'commission',
            commission_id: session.metadata?.commission_request_id || null
          });

        if (insertError) {
          console.error('Error inserting earning from checkout session (TEST MODE):', insertError);
        } else {
          syncedCount++;
          commissionCount++;
          console.log(`Synced commission checkout session (TEST MODE): ${session.id} - $${amount}`);
        }
      }
    }

    console.log(`Sync completed (TEST MODE). ${syncedCount} new earnings synced (${commissionCount} commissions, ${syncedCount - commissionCount} subscriptions). Account status updated: ${accountUpdateSuccess}`);

    return new Response(JSON.stringify({ 
      success: true, 
      syncedCount,
      commissionCount,
      subscriptionCount: syncedCount - commissionCount,
      totalCharges: charges.data.length,
      totalCheckoutSessions: checkoutSessions.data.length,
      accountStatusUpdated: accountUpdateSuccess,
      testMode: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Sync earnings error (TEST MODE):', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
