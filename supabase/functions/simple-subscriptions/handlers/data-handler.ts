
export async function handleGetUserSubscriptions(supabase: any, user: any) {
  console.log('[SimpleSubscriptions] Getting user subscriptions for user:', user.id);
  
  // Get from user_subscriptions table - only include active subscriptions
  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      creator:creators(id, display_name, profile_image_url),
      tier:membership_tiers(id, title, description, price)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return { subscriptions: subscriptions || [] };
}

export async function handleGetCreatorSubscribers(stripe: any, supabase: any, creatorId: string) {
  console.log('[SimpleSubscriptions] Getting creator subscribers for creator:', creatorId);
  
  // Get all tiers for this creator
  console.log('[SimpleSubscriptions] Fetching all tiers for creator:', creatorId);
  const { data: tiers } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('creator_id', creatorId);
  
  console.log('[SimpleSubscriptions] Found tiers for creator:', tiers?.map(t => ({ id: t.id, title: t.title, price: t.price, stripe_price_id: t.stripe_price_id })));
  
  if (!tiers || tiers.length === 0) {
    console.log('[SimpleSubscriptions] No tiers found for creator');
    return { subscribers: [] };
  }

  // Sync with Stripe for each tier
  await syncStripeSubscriptions(stripe, supabase, tiers, creatorId);
  
  // Get the synced data from user_subscriptions table
  console.log('[SimpleSubscriptions] Fetching final results from user_subscriptions table');
  
  const { data: allUserSubs, error: allSubsError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('status', 'active');

  console.log('[SimpleSubscriptions] Raw user_subscriptions data:', allUserSubs);
  console.log('[SimpleSubscriptions] Raw user_subscriptions error:', allSubsError);

  const { data: subscribers, error: subscribersError } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      user:user_id(id, username, email, profile_picture),
      tier:tier_id(id, title, price)
    `)
    .eq('creator_id', creatorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  console.log('[SimpleSubscriptions] Subscribers query error:', subscribersError);
  console.log('[SimpleSubscriptions] Final subscribers count:', subscribers?.length || 0);
  
  if (subscribers && subscribers.length > 0) {
    subscribers.forEach((sub, index) => {
      console.log(`[SimpleSubscriptions] Final subscriber ${index + 1}:`, {
        user_email: sub.user?.email,
        tier_title: sub.tier?.title,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        amount: sub.amount,
        stripe_subscription_id: sub.stripe_subscription_id,
        user_data_exists: !!sub.user,
        tier_data_exists: !!sub.tier
      });
    });
  } else {
    console.log('[SimpleSubscriptions] No subscribers found in final query, but raw data shows:', allUserSubs?.length || 0, 'records');
    
    if (allUserSubs && allUserSubs.length > 0) {
      console.log('[SimpleSubscriptions] Returning raw subscription data without user/tier details');
      const rawSubscribers = allUserSubs.map(sub => ({
        ...sub,
        user: null,
        tier: null
      }));
      
      return { subscribers: rawSubscribers };
    }
  }
  
  return { subscribers: subscribers || [] };
}

async function syncStripeSubscriptions(stripe: any, supabase: any, tiers: any[], creatorId: string) {
  console.log('[SimpleSubscriptions] Starting detailed Stripe sync for creator:', creatorId);
  
  for (const tier of tiers) {
    console.log('[SimpleSubscriptions] Processing tier:', tier.title, 'with stripe_price_id:', tier.stripe_price_id);
    
    if (!tier.stripe_price_id) {
      console.log('[SimpleSubscriptions] Tier has no stripe_price_id, skipping');
      continue;
    }
    
    try {
      console.log('[SimpleSubscriptions] Fetching ALL Stripe subscriptions for price:', tier.stripe_price_id);
      const stripeSubscriptions = await stripe.subscriptions.list({
        price: tier.stripe_price_id,
        status: 'all',
        limit: 100,
      });
      
      console.log('[SimpleSubscriptions] Found', stripeSubscriptions.data.length, 'total Stripe subscriptions for tier:', tier.title);
      
      const activeSubscriptions = stripeSubscriptions.data.filter(sub => sub.status === 'active');
      console.log('[SimpleSubscriptions] Active subscriptions for tier', tier.title + ':', activeSubscriptions.length);
      
      for (const stripeSub of activeSubscriptions) {
        console.log('[SimpleSubscriptions] Processing ACTIVE Stripe subscription:', stripeSub.id, 'status:', stripeSub.status);
        
        // Get customer details
        const customer = await stripe.customers.retrieve(stripeSub.customer as string);
        
        if (customer.deleted) {
          console.log('[SimpleSubscriptions] Customer deleted, skipping');
          continue;
        }
        
        console.log('[SimpleSubscriptions] Customer email:', customer.email);
        
        // Find user by email
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', customer.email)
          .single();
        
        if (!userData) {
          console.log('[SimpleSubscriptions] No user found for email:', customer.email);
          continue;
        }
        
        console.log('[SimpleSubscriptions] Found user:', userData.id, 'for subscription:', stripeSub.id);
        
        // Upsert subscription in user_subscriptions table
        const subscriptionData = {
          user_id: userData.id,
          creator_id: creatorId,
          tier_id: tier.id,
          stripe_subscription_id: stripeSub.id,
          stripe_customer_id: stripeSub.customer,
          status: 'active',
          amount: tier.price,
          current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSub.cancel_at_period_end || false,
          updated_at: new Date().toISOString()
        };
        
        console.log('[SimpleSubscriptions] Upserting subscription data:', subscriptionData);
        
        const { error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert(subscriptionData, { 
            onConflict: 'user_id,creator_id,tier_id',
            ignoreDuplicates: false 
          });
        
        if (upsertError) {
          console.error('[SimpleSubscriptions] Error upserting subscription:', upsertError);
        } else {
          console.log('[SimpleSubscriptions] Successfully upserted subscription for user:', userData.id);
        }
      }
    } catch (error) {
      console.error('[SimpleSubscriptions] Error fetching Stripe subscriptions for tier:', tier.title, error);
    }
  }
}
