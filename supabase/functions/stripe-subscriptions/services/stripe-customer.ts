
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getOrCreateStripeCustomer(
  stripe: any,
  supabaseService: any,
  user: any
): Promise<string> {
  console.log('Checking for existing Stripe customer...');
  
  let stripeCustomerId;
  const { data: existingCustomer } = await supabaseService
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (existingCustomer) {
    stripeCustomerId = existingCustomer.stripe_customer_id;
    console.log('Found existing customer:', stripeCustomerId);
  } else {
    console.log('Creating new Stripe customer...');
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id,
      },
    });
    stripeCustomerId = customer.id;
    console.log('Created new customer:', stripeCustomerId);

    // Store customer in database
    await supabaseService
      .from('stripe_customers')
      .insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
      });
  }

  return stripeCustomerId;
}

export async function getOrCreateStripePrice(
  stripe: any,
  supabaseService: any,
  tier: any,
  tierId: string
): Promise<string> {
  console.log('Checking Stripe price...');
  
  let stripePriceId = tier.stripe_price_id;
  if (!stripePriceId) {
    console.log('Creating new Stripe price...');
    const price = await stripe.prices.create({
      unit_amount: Math.round(tier.price * 100), // Convert to cents
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: {
        name: tier.title,
      },
    });
    stripePriceId = price.id;
    console.log('Created price:', stripePriceId);

    // Update tier with price ID
    await supabaseService
      .from('membership_tiers')
      .update({ stripe_price_id: stripePriceId })
      .eq('id', tierId);
  }

  console.log('Using price ID:', stripePriceId);
  return stripePriceId;
}
