
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, CreditCard, ChevronDown, ArrowLeft, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSubscriptionEventManager } from '@/hooks/useSubscriptionEventManager';

const stripePromise = loadStripe('pk_test_51RSMPcCli7UywJeny27NOjHOOJpnWXWGIU5zRdZBPQ1rze66AjgyeGqqzwJ22PueDNWuvJojwP85r8YPgAjyTAXB00bY7GCGHL');

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { triggerSubscriptionSuccess, invalidateAllSubscriptionQueries } = useSubscriptionEventManager();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const { 
    clientSecret, 
    amount, 
    tierName, 
    tierId, 
    creatorId,
    isUpgrade,
    currentTier,
    proratedAmount,
    originalAmount,
    currentPeriodEnd
  } = location.state || {};

  // Calculate pricing details
  const monthlyAmount = amount ? amount / 100 : 30;
  const salesTax = monthlyAmount * 0.046; // 4.6% tax example
  const totalToday = monthlyAmount + salesTax;

  useEffect(() => {
    if (!clientSecret) {
      toast({
        title: "Payment Error",
        description: "No payment information found. Please try subscribing again.",
        variant: "destructive"
      });
      navigate('/');
    }
    if (amount) {
      setPaymentAmount((amount / 100).toFixed(2));
    }
  }, [clientSecret, amount, navigate, toast]);

  const handleCancel = () => {
    console.log('User cancelled payment, navigating back');
    
    // Clear any temporary state
    setIsProcessing(false);
    setPaymentSucceeded(false);
    setIsVerifying(false);
    
    toast({
      title: "Payment Cancelled",
      description: "You can return anytime to complete your subscription.",
    });
    
    // Navigate back to previous page or creator page
    navigate(-1);
  };

  const verifySubscriptionInDB = async (maxRetries = 10, retryDelay = 1500) => {
    console.log('Verifying subscription in database...');
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Verification attempt ${i + 1}/${maxRetries}`);
        
        // Check ONLY user_subscriptions table
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('tier_id', tierId)
          .eq('creator_id', creatorId)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('DB verification error:', error);
        } else if (data) {
          console.log('Subscription found in user_subscriptions table:', data);
          return true;
        }
        
        // Shorter delay and fewer retries for faster verification
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } catch (error) {
        console.error('Error verifying subscription in DB:', error);
      }
    }
    
    console.log('Subscription not found in database after all retries');
    return false;
  };

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('Confirming payment with client secret:', clientSecret);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        toast({
          title: "Payment Failed",
          description: error.message || 'Payment could not be processed',
          variant: "destructive"
        });
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        setPaymentSucceeded(true);
        setIsVerifying(true);
        
        const successMessage = isUpgrade 
          ? `Processing your upgrade to ${tierName}...`
          : `Processing your subscription to ${tierName}...`;
        
        toast({
          title: "Payment Successful!",
          description: successMessage,
        });

        // Shorter wait time for webhook processing
        console.log('Waiting for webhook processing...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const verified = await verifySubscriptionInDB();
        
        if (verified) {
          console.log('Subscription verified in database');
          
          // Trigger comprehensive subscription success events
          triggerSubscriptionSuccess({
            tierId,
            creatorId,
            paymentIntentId: paymentIntent.id
          });
          
          // Force refresh all subscription data
          await invalidateAllSubscriptionQueries();
          
          const finalMessage = isUpgrade 
            ? `You've successfully upgraded to ${tierName}`
            : `You've successfully subscribed to ${tierName}`;
          
          toast({
            title: isUpgrade ? "Upgrade Complete!" : "Subscription Active!",
            description: finalMessage,
          });

          setTimeout(() => {
            navigate('/subscriptions');
          }, 1500);
        } else {
          console.warn('Payment succeeded but subscription not found in database');
          
          // Still trigger events as payment succeeded
          triggerSubscriptionSuccess({
            tierId,
            creatorId,
            paymentIntentId: paymentIntent.id
          });
          
          await invalidateAllSubscriptionQueries();
          
          toast({
            title: "Payment Processed",
            description: "Your payment was successful. Your subscription should be active shortly. Please check your subscriptions page.",
          });

          setTimeout(() => {
            navigate('/subscriptions');
          }, 2000);
        }
        
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSucceeded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-gray-400">
                    {isUpgrade ? 'Processing your upgrade...' : 'Activating your subscription...'}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400">
                  {isUpgrade 
                    ? `You've successfully upgraded to ${tierName}. Redirecting to your subscriptions...`
                    : `You've successfully subscribed to ${tierName}. Redirecting to your subscriptions...`
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading payment information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isUpgrade ? 'Upgrade Payment' : 'Payment details'}
              </h1>
              {isUpgrade && (
                <div className="flex items-center gap-2 text-blue-400 mb-4">
                  <TrendingUp className="h-5 w-5" />
                  <span>Upgrading from {currentTier} to {tierName}</span>
                </div>
              )}
            </div>

            {/* Payment Amount Section */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Payment amount</h2>
                {isUpgrade ? (
                  <p className="text-gray-400 text-sm mb-4">
                    You're upgrading your subscription. Only the prorated difference will be charged today.
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm mb-4">Pay the set price or you can choose to pay more.</p>
                )}
                
                <div className="space-y-3">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400">
                          {isUpgrade ? 'Prorated upgrade charge' : 'Monthly payment'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {isUpgrade 
                            ? `$${proratedAmount || monthlyAmount} (difference from $${originalAmount}/month)`
                            : `$${monthlyAmount}/month`
                          }
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">$</span>
                        <Input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-20 bg-transparent border-gray-600 text-white text-right"
                          step="0.01"
                          min={monthlyAmount}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Payment method</h2>
                
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-xs text-white font-bold">VISA</span>
                      </div>
                      <span className="text-sm">•••• •••• •••• ••••</span>
                    </div>
                  </div>
                  
                  <div className="border border-gray-700 rounded-md p-3">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#ffffff',
                            fontFamily: 'system-ui, sans-serif',
                            '::placeholder': {
                              color: '#9ca3af',
                            },
                            backgroundColor: 'transparent',
                          },
                          invalid: {
                            color: '#ef4444',
                            iconColor: '#ef4444',
                          },
                        },
                        hidePostalCode: false,
                      }}
                    />
                  </div>
                </div>

                <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm">
                  <span>Add new payment method</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Payment Terms */}
              <div className="text-sm text-gray-400 space-y-2">
                {isUpgrade ? (
                  <p>
                    You'll pay ${totalToday.toFixed(2)} today for the upgrade. Your subscription will continue at ${originalAmount}/month and renew on {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : 'your next billing date'}.
                  </p>
                ) : (
                  <p>
                    You'll pay ${totalToday.toFixed(2)} today, and then ${monthlyAmount.toFixed(2)} monthly on the 1st. Your next charge will be on 1 June.
                  </p>
                )}
                <p>
                  By clicking {isUpgrade ? 'Upgrade now' : 'Subscribe now'}, you agree to FanRealms's Terms of Use and Privacy Policy. This subscription automatically renews monthly, and you'll be notified in advance if the monthly amount increases. Cancel at any time in your membership settings.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Subscribe Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={!stripe || isProcessing}
                  className="w-full bg-white text-black hover:bg-gray-100 text-lg py-6 rounded-lg font-medium"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      {isUpgrade ? 'Upgrade now' : 'Subscribe now'}
                    </>
                  )}
                </Button>

                {/* Cancel Button */}
                <Button 
                  onClick={handleCancel}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-lg py-6 rounded-lg font-medium"
                  size="lg"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Cancel and go back
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:pl-8">
            <Card className="bg-gray-900 border-gray-800 sticky top-6">
              <CardHeader>
                <CardTitle className="text-white">
                  {isUpgrade ? 'Upgrade summary' : 'Order summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Creator Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {tierName?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{tierName || 'Creator'}</div>
                    <div className="text-gray-400 text-sm">
                      {isUpgrade ? `Upgrading from ${currentTier}` : 'ULTRA Gamer'}
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  {isUpgrade ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current tier ({currentTier})</span>
                        <span className="text-white">${((originalAmount || 0) - (proratedAmount || 0)).toFixed(2)}/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">New tier ({tierName})</span>
                        <span className="text-white">${originalAmount}/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Prorated difference</span>
                        <span className="text-white">${(proratedAmount || monthlyAmount).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monthly payment</span>
                        <span className="text-white">${monthlyAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">One-time credit</span>
                        <span className="text-white">-$10.00</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sales Tax</span>
                    <span className="text-white">${salesTax.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-3 border-t border-gray-700">
                    <span className="text-white font-semibold">Total due today</span>
                    <span className="text-white font-semibold">${totalToday.toFixed(2)}</span>
                  </div>
                  
                  {isUpgrade && currentPeriodEnd && (
                    <div className="text-xs text-gray-500 mt-2">
                      Next billing: {new Date(currentPeriodEnd).toLocaleDateString()} at ${originalAmount}/month
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
              <button className="hover:text-white">Help Centre</button>
              <span>$ USD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Payment() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
