import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SecurePaymentMethod {
  id: string;
  masked_display: string;
  is_default: boolean;
  created_month: string;
}

export const useSecurePaymentMethods = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<SecurePaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = async () => {
    if (!user?.id) {
      setPaymentMethods([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_safe_payment_display', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching secure payment methods:', error);
        setError(error.message);
        setPaymentMethods([]);
      } else {
        setPaymentMethods(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load payment methods');
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [user?.id]);

  return {
    paymentMethods,
    isLoading,
    error,
    refetch: fetchPaymentMethods
  };
};