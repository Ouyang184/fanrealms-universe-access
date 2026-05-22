
import React from 'react';
import { PaymentElement } from '@stripe/react-stripe-js';
import { Plus } from 'lucide-react';

export function PaymentMethodSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Payment method</h2>

      {/* Payment Element */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="border border-border rounded-md p-3">
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
        className="flex items-center space-x-2 text-primary hover:text-primary/80 text-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Add new payment method</span>
      </button>
    </div>
  );
}
