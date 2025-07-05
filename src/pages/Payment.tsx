
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MembershipPaymentForm } from '@/components/payment/MembershipPaymentForm';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

export default function Payment() {
  const params = useParams();
  const tierId = params.tierId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: tier, isLoading, error } = useQuery({
    queryKey: ['membership-tier', tierId],
    queryFn: async () => {
      if (!tierId) throw new Error('Tier ID is required');
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select(`
          *,
          creator:creators(display_name, profile_image_url)
        `)
        .eq('id', tierId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!tierId,
  });

  const handlePaymentSuccess = () => {
    navigate('/subscriptions');
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

  if (error || !tier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tier Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The membership tier could not be found.
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
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-muted-foreground">
            Subscribe to {tier.creator?.display_name}'s {tier.name} tier
          </p>
        </div>

        <MembershipPaymentForm
          tier={tier}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          stripePublishableKey={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}
        />
      </div>
    </div>
  );
}
