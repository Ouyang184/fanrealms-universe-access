
import React from 'react';
import { PaymentElement } from '@stripe/react-stripe-js';
import { ChevronDown } from 'lucide-react';

export function PaymentMethodSection() {
  return (
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
          <PaymentElement
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  name: '',
                }
              }
            }}
          />
        </div>
      </div>

      <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm">
        <span>Add new payment method</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
