import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/Layout/MainLayout';
import { AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

function readHsl(varName: string) {
  if (typeof window === 'undefined') return '#000';
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `hsl(${v})` : '#000';
}

export default function PaymentPage() {
  const location = useLocation();
  const { clientSecret } = (location.state as any) || {};
  const [appearance, setAppearance] = useState<any>(null);

  useEffect(() => {
    setAppearance({
      theme: 'flat',
      variables: {
        colorPrimary: readHsl('--primary'),
        colorBackground: readHsl('--card'),
        colorText: readHsl('--foreground'),
        colorTextSecondary: readHsl('--muted-foreground'),
        colorDanger: readHsl('--destructive'),
        borderRadius: '8px',
        fontFamily: 'Space Grotesk, system-ui, sans-serif',
      },
    });
  }, []);

  if (!clientSecret) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-lg font-semibold">No payment information found.</p>
          <p className="text-muted-foreground">Please go back and try subscribing again.</p>
          <Button asChild variant="outline">
            <Link to="/marketplace">Back to marketplace</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!appearance) return null;

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance }}
    >
      <PaymentForm />
    </Elements>
  );
}
