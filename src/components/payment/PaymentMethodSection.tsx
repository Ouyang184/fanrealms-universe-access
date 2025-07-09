
import React from 'react';
import { PaymentElement } from '@stripe/react-stripe-js';
import { Plus } from 'lucide-react';

export function PaymentMethodSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Payment method</h2>
      
      {/* Payment Element */}
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
