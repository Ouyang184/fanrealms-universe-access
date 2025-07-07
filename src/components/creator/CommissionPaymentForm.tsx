
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Clock, User, DollarSign, AlertCircle, Bug } from 'lucide-react';

// Safely get Stripe publishable key without throwing at module level
const getStripePublishableKey = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn('VITE_STRIPE_PUBLISHABLE_KEY environment variable is not set');
    return null;
  }
  console.log('🔑 Using Stripe publishable key from environment:', key.substring(0, 20) + '...');
  return key;
};

// Only create stripe promise if key exists
const createStripePromise = () => {
  const key = getStripePublishableKey();
  return key ? loadStripe(key) : null;
};

const stripePromise = createStripePromise();

interface CommissionPaymentFormProps {
  commission: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  commission: any;
  onSuccess: () => void;
  onCancel: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Configuration Error Component (rendered when Stripe is not configured)
function StripeConfigurationError({ onCancel }: { onCancel: () => void }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuration Error</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
            <h3 className="text-sm font-medium text-red-800">Stripe Not Configured</h3>
          </div>
          <p className="text-sm text-red-700 mt-2">
            The VITE_STRIPE_PUBLISHABLE_KEY environment variable is not set. Please configure your Stripe keys to enable payments.
          </p>
        </div>
        <div className="flex justify-between">
          <Button variant="secondary" onClick={onCancel}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentFormContent({ commission, onSuccess, onCancel }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDebug = async () => {
    if (!user) {
      console.error('User not authenticated for debug');
      return;
    }

    setIsDebugging(true);
    setError('');

    try {
      console.log('🔍 Running debug check...');
      
      const { data, error } = await supabase.functions.invoke('debug-commission-payment', {
        body: { 
          commissionId: commission.id,
          amount: commission.agreed_price,
          testMode: true
        }
      });

      console.log('🔧 Debug response:', { data, error });

      if (error) {
        console.error('❌ Debug function error:', error);
        setDebugInfo({ 
          type: 'debug_function_error', 
          error,
          timestamp: new Date().toISOString()
        });
        setError(`Debug function failed: ${error.message}`);
      } else {
        console.log('✅ Debug function successful');
        setDebugInfo({ 
          type: 'debug_success', 
          debug_data: data,
          timestamp: new Date().toISOString()
        });
        toast({
          title: "Debug Complete",
          description: "Check the debug information panel below for details.",
        });
      }

    } catch (err) {
      console.error('💥 Debug error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Debug check failed';
      setError(errorMessage);
      setDebugInfo({ 
        type: 'debug_exception', 
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !user) {
      console.error('Stripe not loaded or user not authenticated');
      return;
    }

    setIsProcessing(true);
    setError('');
    setDebugInfo(null);

    try {
      console.log('🔄 Creating payment intent for commission:', commission.id);
      
      const requestPayload = {
        commissionId: commission.id,
        amount: commission.agreed_price
      };
      
      console.log('🔍 Request payload:', requestPayload);
      
      // Create payment intent using the edge function with proper JSON body
      const { data, error } = await supabase.functions.invoke('create-commission-payment-intent', {
        body: requestPayload
      });

      console.log('📊 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Payment intent creation failed:', error);
        setDebugInfo({ 
          type: 'edge_function_error', 
          error,
          timestamp: new Date().toISOString()
        });
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (!data?.client_secret) {
        console.error('❌ No client secret received:', data);
        setDebugInfo({ 
          type: 'invalid_response', 
          data,
          timestamp: new Date().toISOString()
        });
        throw new Error('Invalid response from payment service');
      }

      console.log('✅ Payment intent created successfully');
      setDebugInfo({ 
        type: 'success', 
        debug_info: data.debug_info,
        timestamp: new Date().toISOString()
      });

      console.log('🔑 Using Stripe TEST mode - publishable key from environment variable');

      // Confirm the payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              email: user.email,
            },
          },
        }
      );

      if (confirmError) {
        console.error('❌ Payment confirmation failed:', confirmError);
        setDebugInfo({ 
          type: 'stripe_confirmation_error', 
          error: confirmError,
          timestamp: new Date().toISOString()
        });
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'requires_capture') {
        console.log('✅ Payment authorized successfully - funds held for creator approval');
        toast({
          title: "Payment Authorized! 🎉",
          description: "Your payment has been authorized and funds are held securely. The creator will be notified to review your commission.",
        });
        onSuccess();
      } else {
        console.error('❌ Unexpected payment status:', paymentIntent?.status);
        setDebugInfo({ 
          type: 'unexpected_payment_status', 
          status: paymentIntent?.status,
          timestamp: new Date().toISOString()
        });
        throw new Error('Payment was not processed correctly');
      }

    } catch (err) {
      console.error('💥 Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {formatCurrency(commission.agreed_price)}
          </h2>
          <Badge variant="outline">
            {commission.commission_type?.name}
          </Badge>
          <Badge variant="secondary">TEST MODE</Badge>
        </div>

        <div className="text-sm text-muted-foreground">
          <User className="mr-2 inline-block h-4 w-4" />
          {commission.creator?.display_name}
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Clock className="mr-2 inline-block h-4 w-4" />
          Created on {new Date(commission.created_at).toLocaleDateString()}
        </div>

        <Separator />

        {/* Debug Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-yellow-800">Debug Tools</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDebug}
              disabled={isDebugging}
            >
              {isDebugging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Debug...
                </>
              ) : (
                <>
                  <Bug className="mr-2 h-4 w-4" />
                  Run Debug Check
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-yellow-700">
            Run this debug check to test environment variables, Stripe connection, and database access before attempting payment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Card className="border-2 border-primary/50">
              <CardHeader>
                <CardTitle>Credit Card Information</CardTitle>
              </CardHeader>
              <CardContent>
                <fieldset className="space-y-2">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                    onChange={(e) => {
                      setError(e.error?.message || '');
                    }}
                  />
                </fieldset>
              </CardContent>
            </Card>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Debug Information Panel */}
          {debugInfo && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm text-orange-800">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-orange-700 whitespace-pre-wrap overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={onCancel}>
              Back
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !stripe || !elements}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirm Payment (TEST)
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CommissionPaymentForm(props: CommissionPaymentFormProps) {
  // Check if Stripe is properly configured
  const stripeKey = getStripePublishableKey();
  if (!stripeKey || !stripePromise) {
    return <StripeConfigurationError onCancel={props.onCancel} />;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}
