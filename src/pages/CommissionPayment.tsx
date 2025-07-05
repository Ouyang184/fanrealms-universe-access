

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CommissionPaymentForm } from '@/components/creator/CommissionPaymentForm';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

export default function CommissionPayment() {
  const params = useParams();
  const commissionId = params.requestId;
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('🔍 [CommissionPayment] Component initialized:', {
    urlParams: params,
    commissionId: commissionId,
    user: user?.id,
    route: window.location.pathname
  });

  const { data: commission, isLoading, error } = useQuery({
    queryKey: ['commission-payment', commissionId],
    queryFn: async () => {
      if (!commissionId) {
        console.error('❌ [CommissionPayment] No commission ID provided');
        throw new Error('Commission ID is required');
      }
      
      console.log('🔍 [CommissionPayment] Fetching commission request:', {
        commissionId: commissionId,
        currentUser: user?.id,
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          commission_type:commission_types(name, description, base_price, custom_addons),
          creator:creators!commission_requests_creator_id_fkey(
            display_name,
            profile_image_url
          )
        `)
        .eq('id', commissionId)
        .single();

      console.log('📊 [CommissionPayment] Query result:', {
        commissionId: commissionId,
        data: data,
        error: error,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : null
      });

      if (error) {
        console.error('❌ [CommissionPayment] Database error:', {
          commissionId: commissionId,
          error: error,
          code: error.code,
          message: error.message,
          details: error.details
        });
        throw new Error(`Failed to fetch commission: ${error.message}`);
      }

      if (!data) {
        console.error('❌ [CommissionPayment] No commission data found:', {
          commissionId: commissionId,
          user: user?.id
        });
        throw new Error('Commission request not found');
      }
      
      // Only check permission if user is logged in
      if (user && data.customer_id !== user.id) {
        console.error('❌ [CommissionPayment] Permission denied:', {
          commissionId: commissionId,
          currentUser: user.id,
          commissionCustomer: data.customer_id,
          userEmail: user.email
        });
        throw new Error('You do not have permission to access this commission');
      }
      
      console.log('✅ [CommissionPayment] Commission loaded successfully:', {
        commissionId: commissionId,
        title: data.title,
        status: data.status,
        agreedPrice: data.agreed_price,
        customerId: data.customer_id,
        creatorName: data.creator?.display_name
      });
      
      return data;
    },
    enabled: !!commissionId,
    retry: 3,
    retryDelay: 1000,
  });

  const handlePaymentSuccess = () => {
    navigate(`/commissions/${commissionId}/payment-success`);
  };

  const handlePaymentCancel = () => {
    console.log('Back button clicked, navigating back');
    // Navigate back to the creator page or previous location
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
    console.error('🚨 [CommissionPayment] Rendering error state:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      hasCommission: !!commission,
      commissionId: commissionId,
      urlParams: params
    });

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
            Review your commission details and complete your secure payment
          </p>
        </div>

        <CommissionPaymentForm
          commission={commission}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    </div>
  );
}
