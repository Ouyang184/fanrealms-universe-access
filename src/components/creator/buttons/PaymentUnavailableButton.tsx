
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function PaymentUnavailableButton() {
  return (
    <Button variant="outline" disabled className="w-full">
      <AlertCircle className="mr-2 h-4 w-4" />
      Payments not set up
    </Button>
  );
}
