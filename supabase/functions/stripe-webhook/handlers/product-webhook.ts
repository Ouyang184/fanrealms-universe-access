
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const handleProductWebhook = async (event: any, supabase: any) => {
  console.log('=== PROCESSING PRODUCT WEBHOOK ===');
  console.log('Event type:', event.type);
  console.log('Product ID:', event.data.object.id);

  const product = event.data.object;
  const creatorId = product.metadata?.creator_id;

  if (!creatorId) {
    console.log('No creator_id in product metadata, skipping sync');
    return;
  }

  console.log('Creator ID from metadata:', creatorId);

  try {
    if (event.type === 'product.created' || event.type === 'product.updated') {
      // Get the default price for this product
      let defaultPrice = null;
      if (product.default_price) {
        // If default_price is a string, it's a price ID
        if (typeof product.default_price === 'string') {
          defaultPrice = { unit_amount: 0 }; // We'll get the actual price from our tier data
        } else {
          // If it's an object, it contains the price data
          defaultPrice = product.default_price;
        }
      }

      // Upsert the membership tier
      const { error: upsertError } = await supabase
        .from('membership_tiers')
        .upsert({
          stripe_product_id: product.id,
          creator_id: creatorId,
          title: product.name,
          description: product.description || '',
          active: product.active,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'stripe_product_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Error upserting membership tier:', upsertError);
        throw upsertError;
      }

      console.log('Successfully synced product to membership_tiers table');

    } else if (event.type === 'product.deleted') {
      // Soft delete by setting active to false
      const { error: deleteError } = await supabase
        .from('membership_tiers')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_product_id', product.id);

      if (deleteError) {
        console.error('Error soft-deleting membership tier:', deleteError);
        throw deleteError;
      }

      console.log('Successfully soft-deleted membership tier');
    }

  } catch (error) {
    console.error('Error processing product webhook:', error);
    throw error;
  }
};
