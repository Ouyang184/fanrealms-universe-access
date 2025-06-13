
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handlePriceWebhook(event: any, supabase: any) {
  console.log('=== PROCESSING PRICE WEBHOOK ===');
  console.log('Event type:', event.type);
  
  const price = event.data.object;
  console.log('Price ID:', price.id);
  console.log('Price data:', JSON.stringify(price, null, 2));

  try {
    switch (event.type) {
      case 'price.created':
        await handlePriceCreated(price, supabase);
        break;
      case 'price.updated':
        await handlePriceUpdated(price, supabase);
        break;
      case 'price.deleted':
        await handlePriceDeleted(price, supabase);
        break;
      default:
        console.log('Unhandled price event type:', event.type);
    }
  } catch (error) {
    console.error('Error processing price webhook:', error);
    throw error;
  }
}

async function handlePriceCreated(price: any, supabase: any) {
  console.log('=== HANDLING PRICE CREATED ===');
  
  // Get the product to find the associated tier
  const productId = price.product;
  console.log('Associated product ID:', productId);
  
  // Find the tier in our database that uses this product
  const { data: tier, error: tierError } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('stripe_product_id', productId)
    .single();

  if (tierError || !tier) {
    console.log('No tier found for product, skipping price sync');
    return;
  }

  console.log('Found tier:', tier.id, tier.title);

  // Update the tier with the new price ID if it doesn't have one
  if (!tier.stripe_price_id) {
    const { error: updateError } = await supabase
      .from('membership_tiers')
      .update({
        stripe_price_id: price.id,
        price: price.unit_amount / 100, // Convert from cents to dollars
        updated_at: new Date().toISOString()
      })
      .eq('id', tier.id);

    if (updateError) {
      console.error('Error updating tier with price ID:', updateError);
    } else {
      console.log('Successfully updated tier with new price ID');
    }
  }
}

async function handlePriceUpdated(price: any, supabase: any) {
  console.log('=== HANDLING PRICE UPDATED ===');
  
  // Find the tier that uses this price
  const { data: tier, error: tierError } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('stripe_price_id', price.id)
    .single();

  if (tierError || !tier) {
    console.log('No tier found for price, skipping update');
    return;
  }

  console.log('Found tier to update:', tier.id, tier.title);

  // Update the tier with the new price amount
  const { error: updateError } = await supabase
    .from('membership_tiers')
    .update({
      price: price.unit_amount / 100, // Convert from cents to dollars
      updated_at: new Date().toISOString()
    })
    .eq('id', tier.id);

  if (updateError) {
    console.error('Error updating tier price:', updateError);
  } else {
    console.log('Successfully updated tier price');
  }
}

async function handlePriceDeleted(price: any, supabase: any) {
  console.log('=== HANDLING PRICE DELETED ===');
  
  // Find the tier that uses this price
  const { data: tier, error: tierError } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('stripe_price_id', price.id)
    .single();

  if (tierError || !tier) {
    console.log('No tier found for deleted price, nothing to update');
    return;
  }

  console.log('Found tier with deleted price:', tier.id, tier.title);

  // Clear the price ID from the tier since the price no longer exists
  const { error: updateError } = await supabase
    .from('membership_tiers')
    .update({
      stripe_price_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', tier.id);

  if (updateError) {
    console.error('Error clearing tier price ID:', updateError);
  } else {
    console.log('Successfully cleared price ID from tier');
  }
}
