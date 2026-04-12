import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMarketplaceCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  async function checkout(productId: string) {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to purchase');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { productId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw new Error(error.message ?? 'Failed to create checkout session');
      if (!data?.url) throw new Error('No checkout URL returned from server');

      // Redirect to Stripe-hosted checkout — no need to setIsLoading(false)
      // because the page is navigating away
      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      toast.error(message);
      setIsLoading(false);
    }
  }

  return { checkout, isLoading };
}
