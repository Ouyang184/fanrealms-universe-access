
import { loadStripe } from '@stripe/stripe-js';

// Get the publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Log the status for debugging
console.log('Stripe configuration:', {
  hasKey: !!stripePublishableKey,
  keyPrefix: stripePublishableKey ? stripePublishableKey.substring(0, 12) + '...' : 'undefined'
});

// Validate the key exists
if (!stripePublishableKey) {
  console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
  console.error('Please ensure VITE_STRIPE_PUBLISHABLE_KEY is set in your Supabase project settings');
}

// Export the Stripe promise - this will be null if no key is provided
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Export a function to check if Stripe is properly configured
export const isStripeConfigured = (): boolean => {
  return !!stripePublishableKey;
};

// Export the key for direct access if needed
export const getStripePublishableKey = (): string | undefined => {
  return stripePublishableKey;
};
