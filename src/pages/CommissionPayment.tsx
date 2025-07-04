import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, User, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CommissionRequest {
  id: string;
  title: string;
  description: string;
  agreed_price: number;
  status: string;
  commission_type: {
    name: string;
    description: string;
  };
  creator: {
    display_name: string;
    profile_image_url: string;
  };
}

export default function CommissionPayment() {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commissionRequest, setCommissionRequest] = useState<CommissionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestId) {
      fetchCommissionRequest();
    }
  }, [requestId]);

  const fetchCommissionRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          commission_type:commission_types(name, description),
          creator:creators!commission_requests_creator_id_fkey(
            display_name,
            profile_image_url
          )
        `)
        .eq('id', requestId)
        .eq('customer_id', user?.id)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Commission request not found or not accessible');
        return;
      }

      // Check if request is in correct status for payment
      if (data.status !== 'pending') {
        if (data.status === 'payment_pending') {
          setError('Payment is already being processed for this commission');
        } else if (data.status === 'accepted') {
          setError('This commission has already been accepted and paid');
        } else if (data.status === 'rejected') {
          setError('This commission request has been rejected');
        } else {
          setError(`Commission is in ${data.status} status and cannot be paid`);
        }
        return;
      }

      if (!data.agreed_price) {
        setError('No agreed price set for this commission. Please wait for the creator to set a price.');
        return;
      }

      setCommissionRequest(data);
    } catch (error) {
      console.error('Error fetching commission request:', error);
      setError('Failed to load commission request');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!commissionRequest || !user) {
      console.log('Missing required data:', { commissionRequest: !!commissionRequest, user: !!user });
      return;
    }

    console.log('Starting payment process for commission:', commissionRequest.id);
    setIsProcessing(true);
    
    try {
      console.log('Calling create-commission-payment function...');
      const { data, error } = await supabase.functions.invoke('create-commission-payment', {
        body: {
          commissionId: commissionRequest.id,
          customerId: user.id
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe Checkout:', data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('No payment URL received:', data);
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initiate payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !commissionRequest) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Payment Not Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'Commission request not found'}
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Login Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please login to proceed with payment
            </p>
            <Button onClick={() => navigate('/login')}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Commission Payment</h1>
        <p className="text-muted-foreground">Complete your commission payment</p>
      </div>

      <Alert className="mb-6 border-blue-500 bg-blue-950/50 text-blue-100">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-100">
          <strong className="text-blue-200">Payment Authorization:</strong> Your card will be authorized but not charged immediately. 
          Payment will only be captured when the creator accepts your commission request.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            {commissionRequest.creator.profile_image_url && (
              <img 
                src={commissionRequest.creator.profile_image_url} 
                alt={commissionRequest.creator.display_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {commissionRequest.creator.display_name}
              </CardTitle>
              <Badge variant="secondary" className="mt-1">Creator</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Commission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{commissionRequest.title}</h3>
            <Badge variant="outline" className="mt-1">
              {commissionRequest.commission_type.name}
            </Badge>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Description:</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {commissionRequest.description}
            </p>
          </div>

          {commissionRequest.commission_type.description && (
            <div>
              <h4 className="font-medium mb-2">Commission Type Details:</h4>
              <p className="text-sm text-muted-foreground">
                {commissionRequest.commission_type.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium">Authorization Amount:</span>
            <span className="font-bold text-2xl">
              ${commissionRequest.agreed_price.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Your card will be authorized for this amount. Payment will only be captured if the creator accepts your commission.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          onClick={() => navigate(-1)} 
          variant="outline" 
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={isProcessing || !commissionRequest}
          className="flex-1"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Authorize ${commissionRequest.agreed_price.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
