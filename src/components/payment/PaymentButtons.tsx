
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';

interface PaymentButtonsProps {
  isUpgrade: boolean;
  isProcessing: boolean;
  onPayment: (stripe: any, elements: any, event: React.FormEvent) => void;
  onCancel?: () => void;
  stripe: any;
  elements: any;
}

export function PaymentButtons({ 
  isUpgrade, 
  isProcessing, 
  onPayment, 
  onCancel,
  stripe,
  elements
}: PaymentButtonsProps) {
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onPayment(stripe, elements, event);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      console.log('User cancelled payment, navigating back');
      navigate(-1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Button 
        type="submit"
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

      <Button 
        type="button"
        onClick={handleCancel}
        disabled={isProcessing}
        variant="outline"
        className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-lg py-6 rounded-lg font-medium"
        size="lg"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Cancel and go back
      </Button>
    </form>
  );
}
