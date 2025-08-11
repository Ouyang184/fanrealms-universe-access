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
import { useUserCommissionRequests } from '@/hooks/useUserCommissionRequests';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CommissionElementsForm from '@/components/commissions/CommissionElementsForm';

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


const stripePromise = loadStripe(window.env?.VITE_STRIPE_PUBLISHABLE_KEY || "");

export default function CommissionPayment() {
  const { requestId } = useParams<{ requestId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { deleteRequest, isDeleting } = useUserCommissionRequests();
  const [commissionRequest, setCommissionRequest] = useState<CommissionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [cancelRedirect, setCancelRedirect] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  useEffect(() => {
    if (requestId && user?.id && !loading) {
      fetchCommissionRequest();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [requestId, user, loading]);

  const fetchCommissionRequest = async () => {
    try {
      setError(null);
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

      // Allow proceeding when status is 'pending' or 'payment_pending'
      if (data.status !== 'pending' && data.status !== 'payment_pending') {
        if (data.status === 'payment_authorized') {
          setError('Payment has been authorized and is awaiting creator acceptance');
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

  const createPaymentIntent = async (commissionId: string) => {
    try {
      setIsCreatingIntent(true);
      const { data, error } = await supabase.functions.invoke('create-commission-payment-intent', {
        body: { commissionId }
      });
      if (error) throw new Error(error.message || 'Failed to create payment intent');
      if (!data?.clientSecret) throw new Error('No client secret received');
      setClientSecret(data.clientSecret);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create payment intent';
      setError(msg);
      toast({ title: 'Payment Error', description: msg, variant: 'destructive' });
    } finally {
      setIsCreatingIntent(false);
    }
  };


  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setCancelRedirect(false);
    setRedirectCountdown(null);
    fetchCommissionRequest();
  };

  // Create the payment intent once commission is loaded
  useEffect(() => {
    if (commissionRequest?.id && user && !clientSecret && !isCreatingIntent) {
      createPaymentIntent(commissionRequest.id);
    }
  }, [commissionRequest?.id, user, clientSecret, isCreatingIntent]);

  // Auto-redirect effect for specific error conditions
  useEffect(() => {
    if (error && !cancelRedirect && !redirectCountdown) {
      const shouldAutoRedirect = 
        error.includes('Payment is already being processed') ||
        error.includes('Payment has been authorized and is awaiting') ||
        error.includes('Commission is in') ||
        error.includes('Commission has already been accepted');
      if (shouldAutoRedirect) {
        setRedirectCountdown(3);
        const countdown = setInterval(() => {
          setRedirectCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdown);
              if (!cancelRedirect) {
                navigate('/explore');
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(countdown);
      }
    }
  }, [error, cancelRedirect, navigate]);

  const handleStayOnPage = () => {
    setCancelRedirect(true);
    setRedirectCountdown(null);
  };

  const handleCancel = async () => {
    if (!requestId) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel this commission request? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      deleteRequest(requestId);
      // Navigate immediately after calling delete - the hook handles the backend deletion
      navigate('/explore');
    } catch (error) {
      console.error('Error canceling commission request:', error);
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
            
            {redirectCountdown !== null && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm mb-2">
                  Redirecting to explore page in {redirectCountdown} seconds...
                </p>
                <Button onClick={handleStayOnPage} variant="outline" size="sm">
                  Stay on this page
                </Button>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              {retryCount < 3 && (
                <Button onClick={handleRetry} variant="outline">
                  Try Again
                </Button>
              )}
              <Button onClick={() => navigate(-1)} variant="outline">
                Go Back
              </Button>
            </div>
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

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-950/50 text-red-100">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-100">
            <strong className="text-red-200">Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCreatingIntent && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing secure payment...
            </div>
          )}
          {!isCreatingIntent && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#ffffff',
                    colorText: '#ffffff',
                    colorTextSecondary: '#9ca3af',
                    borderRadius: '8px',
                    colorBackground: '#1f2937',
                    colorDanger: '#ef4444',
                  }
                }
              }}
            >
              <CommissionElementsForm 
                requestId={commissionRequest.id}
                amount={commissionRequest.agreed_price}
              />
            </Elements>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          onClick={handleCancel}
          variant="outline" 
          className="flex-1"
          disabled={isProcessing || isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Canceling...
            </>
          ) : (
            'Cancel Request'
          )}
        </Button>
      </div>
    </div>
  );
}
