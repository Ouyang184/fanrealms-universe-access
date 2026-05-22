import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Landing page for Stripe 3D-Secure redirects on subscription payments.
 * Stripe appends ?payment_intent=pi_xxx&redirect_status=succeeded|failed
 * when it bounces the user back after 3DS authentication.
 */
export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading');

  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    if (redirectStatus === 'succeeded') {
      setStatus('succeeded');
      // Auto-redirect to subscriptions after a short delay
      const timer = setTimeout(() => navigate('/subscriptions'), 3000);
      return () => clearTimeout(timer);
    } else if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
      setStatus('failed');
    } else {
      // No redirect_status — someone navigated here directly
      navigate('/marketplace', { replace: true });
    }
  }, [redirectStatus, navigate]);

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (status === 'failed') {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">Payment failed</h1>
          <p className="text-muted-foreground text-sm">
            Your payment could not be completed. No charge was made.
          </p>
          <Button asChild variant="outline">
            <Link to="/marketplace">Back to marketplace</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto py-20">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Payment successful!</h1>
            <p className="text-muted-foreground text-sm">
              Your subscription is now active. Redirecting you to your subscriptions…
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting…</span>
            </div>
            <Button asChild variant="link" className="text-sm">
              <Link to="/subscriptions">Go now →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
