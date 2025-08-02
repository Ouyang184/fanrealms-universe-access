export async function handlePaymentMethodWebhook(event: any, supabase: any) {
  console.log('=== PAYMENT METHOD WEBHOOK ===');
  console.log('Event type:', event.type);
  console.log('Event data object type:', event.data.object?.object);

  try {
    switch (event.type) {
      case 'payment_method.attached':
        console.log('Payment method attached:', event.data.object.id);
        await handlePaymentMethodAttached(event, supabase);
        break;
      
      case 'payment_method.detached':
        console.log('Payment method detached:', event.data.object.id);
        await handlePaymentMethodDetached(event, supabase);
        break;
      
      case 'customer.updated':
        console.log('Customer updated:', event.data.object.id);
        await handleCustomerUpdated(event, supabase);
        break;
      
      case 'setup_intent.succeeded':
        console.log('Setup intent succeeded:', event.data.object.id);
        await handleSetupIntentSucceeded(event, supabase);
        break;
      
      case 'setup_intent.canceled':
        console.log('Setup intent canceled:', event.data.object.id);
        // Just log for now, no action needed
        break;
      
      default:
        console.log('Unhandled payment method event type:', event.type);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Payment method webhook error:', error);
    throw error;
  }
}

async function handlePaymentMethodAttached(event: any, supabase: any) {
  const paymentMethod = event.data.object;
  const customerId = paymentMethod.customer;

  console.log('Processing payment method attachment:', {
    paymentMethodId: paymentMethod.id,
    customerId,
    type: paymentMethod.type
  });

  // Find user by stripe customer ID
  const { data: customer, error: customerError } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (customerError || !customer) {
    console.error('Could not find user for customer:', customerId);
    return;
  }

  // Insert payment method into cache
  const paymentMethodData = {
    user_id: customer.user_id,
    stripe_payment_method_id: paymentMethod.id,
    type: paymentMethod.type,
    is_default: false
  };

  if (paymentMethod.card) {
    paymentMethodData.card_brand = paymentMethod.card.brand;
    paymentMethodData.card_last4 = paymentMethod.card.last4;
    paymentMethodData.card_exp_month = paymentMethod.card.exp_month;
    paymentMethodData.card_exp_year = paymentMethod.card.exp_year;
  }

  const { error: insertError } = await supabase
    .from('payment_methods')
    .upsert(paymentMethodData);

  if (insertError) {
    console.error('Error caching payment method:', insertError);
  } else {
    console.log('Payment method cached successfully');
  }
}

async function handlePaymentMethodDetached(event: any, supabase: any) {
  const paymentMethod = event.data.object;

  console.log('Processing payment method detachment:', paymentMethod.id);

  // Remove from cache
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('stripe_payment_method_id', paymentMethod.id);

  if (error) {
    console.error('Error removing payment method from cache:', error);
  } else {
    console.log('Payment method removed from cache successfully');
  }
}

async function handleCustomerUpdated(event: any, supabase: any) {
  const customer = event.data.object;
  const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

  if (!defaultPaymentMethodId) {
    console.log('No default payment method set for customer:', customer.id);
    return;
  }

  console.log('Processing customer default payment method update:', {
    customerId: customer.id,
    defaultPaymentMethodId
  });

  // Find user by stripe customer ID
  const { data: customerData, error: customerError } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', customer.id)
    .single();

  if (customerError || !customerData) {
    console.error('Could not find user for customer:', customer.id);
    return;
  }

  // Update default payment method in cache
  const { error: updateError } = await supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('user_id', customerData.user_id);

  if (updateError) {
    console.error('Error clearing default payment methods:', updateError);
    return;
  }

  const { error: setDefaultError } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('user_id', customerData.user_id)
    .eq('stripe_payment_method_id', defaultPaymentMethodId);

  if (setDefaultError) {
    console.error('Error setting default payment method:', setDefaultError);
  } else {
    console.log('Default payment method updated successfully');
  }
}

async function handleSetupIntentSucceeded(event: any, supabase: any) {
  const setupIntent = event.data.object;
  const paymentMethodId = setupIntent.payment_method;
  const customerId = setupIntent.customer;

  console.log('Processing setup intent success:', {
    setupIntentId: setupIntent.id,
    paymentMethodId,
    customerId
  });

  // The payment_method.attached event will handle caching the payment method
  // This is just for logging and potential future use
  console.log('Setup intent succeeded - payment method should be attached automatically');
}