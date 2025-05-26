
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
    console.log('Manual sync earnings function called');

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
      console.log('ERROR: Creator not found or no Stripe account');
      return new Response(JSON.stringify({ error: 'Creator not found or Stripe not connected' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Creator found:', creator.id);

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.log('ERROR: Missing Stripe secret key');
      return new Response(JSON.stringify({ error: 'Missing Stripe configuration' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
    const supabaseService = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Fetch recent charges from Stripe for this connected account
    console.log('Fetching charges from Stripe...');
    const charges = await stripe.charges.list({
      limit: 50, // Get last 50 charges
      stripeAccount: creator.stripe_account_id
    });

    console.log(`Found ${charges.data.length} charges`);

    let syncedCount = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const charge of charges.data) {
      // Only sync successful charges from the last 30 days
      if (!charge.paid || charge.amount <= 0) continue;
      
      const chargeDate = new Date(charge.created * 1000);
      if (chargeDate < thirtyDaysAgo) continue;

      const amount = charge.amount / 100; // Convert from cents
      const platformFee = amount * 0.05; // 5% platform fee
      const netAmount = amount - platformFee;

      // Check if we already have this earning recorded
      const { data: existingEarning } = await supabaseService
        .from('creator_earnings')
        .select('id')
        .eq('creator_id', creator.id)
        .eq('stripe_transfer_id', charge.id)
        .single();

      if (!existingEarning) {
        // Insert new earning record
        const { error: insertError } = await supabaseService
          .from('creator_earnings')
          .insert({
            creator_id: creator.id,
            amount: amount,
            platform_fee: platformFee,
            net_amount: netAmount,
            stripe_transfer_id: charge.id,
            payment_date: chargeDate.toISOString(),
          });

        if (insertError) {
          console.error('Error inserting earning:', insertError);
        } else {
          syncedCount++;
          console.log(`Synced charge: ${charge.id} - $${amount}`);
        }
      }
    }

    console.log(`Sync completed. ${syncedCount} new earnings synced.`);

    return new Response(JSON.stringify({ 
      success: true, 
      syncedCount,
      totalCharges: charges.data.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Sync earnings error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
