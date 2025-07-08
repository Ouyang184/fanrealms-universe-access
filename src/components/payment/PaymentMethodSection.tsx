
import React from 'react';
import { PaymentElement, CardElement } from '@stripe/react-stripe-js';
import { ChevronDown, CreditCard, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function PaymentMethodSection() {
  const cardElementOptions = {
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
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Payment method</h2>
      
      {/* Card Input */}
      <Card className="border border-gray-700 bg-gray-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">•••• •••• •••• ••••</span>
            </div>
            <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-xs text-white font-bold">VISA</span>
            </div>
          </div>
          <div className="stripe-card-element p-3 border border-gray-600 rounded-md bg-gray-800">
            <CardElement options={cardElementOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Alternative: Use PaymentElement if you prefer */}
      {/*
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="border border-gray-700 rounded-md p-3">
          <PaymentElement
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  name: '',
                  email: '',
                }
              }
            }}
          />
        </div>
      </div>
      */}

      <button 
        type="button"
        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Add new payment method</span>
      </button>
    </div>
  );
}
