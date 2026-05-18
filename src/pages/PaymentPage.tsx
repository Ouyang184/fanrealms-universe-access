import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useLocation, Link } from 'react-router-dom';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

export default function PaymentPage() {
  const location = useLocation();
  const { clientSecret } = (location.state as any) || {};

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">No payment information found.</p>
          <p className="text-gray-400">Please go back and try subscribing again.</p>
          <Button asChild variant="outline">
            <Link to="/marketplace">Back to marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: 'night' } }}
    >
      <PaymentForm />
    </Elements>
  );
}
