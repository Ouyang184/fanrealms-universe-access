
import { loadStripe } from '@stripe/stripe-js';

// Use the test publishable key you provided
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RSMPcCli7UywJeny27NOjHOOJpnWXWGIU5zRdZBPQ1rze66AjgyeGqqzwJ22PueDNWuvJojwP85r8YPgAjyTAXB00bY7GCGHL';

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('Stripe publishable key is missing!');
  throw new Error('Stripe publishable key is required');
}

console.log('Initializing Stripe with key:', STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...');

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
