import { Link, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

/**
 * Shown after a commission payment is authorised — either via direct
 * navigate() from CommissionElementsForm or as a Stripe 3DS return_url.
 */
export default function CommissionPaymentSuccess() {
  const { id } = useParams<{ id: string }>();

  return (
    <MainLayout>
      <div className="max-w-md mx-auto py-20">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Payment authorised!</h1>
            <p className="text-muted-foreground text-sm">
              Your commission payment has been authorised. The creator will be
              notified and your funds are held securely until the work is delivered.
            </p>
            <div className="flex flex-col gap-2">
              {id && (
                <Button asChild>
                  <Link to={`/commissions/${id}`}>View commission</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/marketplace">Back to marketplace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
