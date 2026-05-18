import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CommissionElementsForm from '@/components/commissions/CommissionElementsForm';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

export default function CommissionPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.functions
      .invoke('create-commission-payment', { body: { commissionId: id } })
      .then(({ data, error: fnError }) => {
        if (fnError || !data?.clientSecret) {
          setError('Failed to initialise payment. Please try again.');
        } else {
          setClientSecret(data.clientSecret);
          setAmount(data.amount ?? 0);
        }
      })
      .catch(() => setError('Something went wrong. Please try again.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto py-10 px-4 space-y-6">
        <h1 className="text-[22px] font-bold tracking-[-0.5px]">Commission Payment</h1>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}

        {!loading && error && (
          <div className="space-y-4">
            <p className="text-destructive text-[14px]">{error}</p>
            <Button asChild variant="outline">
              <Link to="/marketplace">Back to marketplace</Link>
            </Button>
          </div>
        )}

        {!loading && clientSecret && id && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: 'stripe' } }}
          >
            <CommissionElementsForm requestId={id} amount={amount} />
          </Elements>
        )}
      </div>
    </MainLayout>
  );
}
