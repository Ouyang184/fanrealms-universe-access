import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CommissionInfo {
  id: string;
  accepts_commissions: boolean;
  commission_base_rate: number | null;
  commission_turnaround_days: number | null;
  commission_slots_available: number | null;
  commission_tos: string | null;
}

export const useSecureCommissionInfo = (creatorId: string) => {
  const { user } = useAuth();
  const [commissionInfo, setCommissionInfo] = useState<CommissionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommissionInfo = async () => {
      if (!creatorId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Only authenticated users can see commission details
        if (!user) {
          setCommissionInfo(null);
          setIsLoading(false);
          return;
        }

        // Use the secure function to get commission info
        const { data, error } = await supabase
          .rpc('get_creator_commission_info', { p_creator_id: creatorId });

        if (error) {
          console.error('Error fetching commission info:', error);
          setError(error.message);
          setCommissionInfo(null);
        } else {
          setCommissionInfo(data && data.length > 0 ? data[0] : null);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load commission information');
        setCommissionInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommissionInfo();
  }, [creatorId, user]);

  return {
    commissionInfo,
    isLoading,
    error,
    isAuthenticated: !!user
  };
};