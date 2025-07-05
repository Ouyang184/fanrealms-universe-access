
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCommissionPayment } from '@/components/creator/EmbeddedCommissionPayment';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function CommissionPayment() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: commission, isLoading, error } = useQuery({
    queryKey: ['commission-payment', id],
    queryFn: async () => {
      if (!id) throw new Error('Commission ID is required');
      
      console.log('Fetching commission request:', id);
      console.log('Current user:', user?.id);
      
      const { data, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          commission_type:commission_types(name, description, base_price),
          creator:creators!commission_requests_creator_id_fkey(
            display_name,
            profile_image_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching commission:', error);
        throw error;
      }
      
      // Check if user has permission to access this commission
      if (!user || data.customer_id !== user.id) {
        throw new Error('You do not have permission to access this commission');
      }
      
      console.log('Commission data:', data);
      return data;
    },
    enabled: !!id && !!user,
  });

  const handlePaymentSuccess = () => {
    navigate(`/commissions/${id}/payment-success`);
  };

  const handlePaymentCancel = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !commission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Commission Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The commission request could not be found or you don't have permission to access it.
            </p>
            <p className="text-sm text-muted-foreground">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!commission.agreed_price) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Price Not Set</h3>
            <p className="text-muted-foreground mb-4">
              The creator hasn't set a price for this commission yet. Please wait for them to review and price your request.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Complete Your Commission Payment</h1>
          <p className="text-muted-foreground">
            Secure payment for your commission request
          </p>
        </div>

        <Elements stripe={stripePromise}>
          <EmbeddedCommissionPayment
            commissionId={commission.id}
            amount={commission.agreed_price}
            title={commission.title}
            creatorName={commission.creator.display_name}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </Elements>
      </div>
    </div>
  );
}
