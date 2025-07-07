
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CommissionRequest {
  id: string;
  title: string;
  agreed_price: number;
  creator: {
    display_name: string;
    user_id: string;
  };
}

export default function CommissionPaymentSuccess() {
  const { requestId } = useParams<{ requestId: string }>();
  const [commissionRequest, setCommissionRequest] = useState<CommissionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          id,
          title,
          agreed_price,
          creator:creators!commission_requests_creator_id_fkey(
            display_name,
            user_id
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setCommissionRequest(data);
    } catch (error) {
      console.error('Error fetching commission request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {commissionRequest && (
            <>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{commissionRequest.title}</h3>
                <p className="text-muted-foreground mb-2">
                  by {commissionRequest.creator.display_name}
                </p>
                <p className="font-bold text-xl">
                  ${commissionRequest.agreed_price.toFixed(2)} paid
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your commission payment has been processed successfully. 
                  The creator will now begin working on your commission.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• The creator will receive notification of your payment</li>
                    <li>• Work will begin on your commission</li>
                    <li>• You'll receive updates via messages or notifications</li>
                    <li>• Final deliverables will be provided upon completion</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/messages">
                <MessageCircle className="mr-2 h-4 w-4" />
                View Messages
              </Link>
            </Button>
            <Button asChild>
              <Link to="/feed">
                Continue Browsing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
