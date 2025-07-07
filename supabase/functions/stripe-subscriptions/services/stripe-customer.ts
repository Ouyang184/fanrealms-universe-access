
export async function getOrCreateStripeCustomer(stripe: any, supabase: any, user: any) {
  console.log('Getting or creating Stripe customer for user:', user.id);
  
  try {
    // Check if customer already exists in our database
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer && !fetchError) {
      console.log('Found existing Stripe customer:', existingCustomer.stripe_customer_id);
      return existingCustomer.stripe_customer_id;
    }

    console.log('No existing customer found, checking Stripe by email...');

    // Check if customer exists in Stripe by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing customer in Stripe:', customerId);
    } else {
      // Create new customer in Stripe
      console.log('Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;
      console.log('Created new Stripe customer:', customerId);
    }

    // Store the customer ID in our database
    console.log('Storing customer ID in database...');
    const { error: insertError } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing customer ID:', insertError);
      // Don't throw error, just log it - the customer ID still works
    } else {
      console.log('Successfully stored customer ID in database');
    }

    return customerId;
  } catch (error) {
    console.error('Error in getOrCreateStripeCustomer:', error);
    throw error;
  }
}
