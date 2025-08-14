import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CommissionRequest } from '@/types/commission';

interface ExistingCommissionWithDetails extends CommissionRequest {
  commission_type: {
    name: string;
    base_price: number;
  };
}

export interface ExistingCommissionCheck {
  hasExisting: boolean;
  existingRequest?: ExistingCommissionWithDetails;
  canResume: boolean;
  needsPayment: boolean;
  shouldShowWarning: boolean;
  actionType: 'new' | 'resume' | 'payment' | 'warning';
  message?: string;
}

export const useExistingCommissionCheck = (commissionTypeId: string, creatorId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['existing-commission-check', user?.id, commissionTypeId, creatorId],
    queryFn: async (): Promise<ExistingCommissionCheck> => {
      if (!user?.id || !commissionTypeId || !creatorId) {
        return {
          hasExisting: false,
          canResume: false,
          needsPayment: false,
          shouldShowWarning: false,
          actionType: 'new'
        };
      }

      // Check for existing requests for this commission type and creator
      const { data: existingRequests, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          commission_type:commission_types(name, base_price)
        `)
        .eq('customer_id', user.id)
        .eq('commission_type_id', commissionTypeId)
        .eq('creator_id', creatorId)
        .in('status', ['pending', 'payment_pending', 'payment_failed', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking existing requests:', error);
        return {
          hasExisting: false,
          canResume: false,
          needsPayment: false,
          shouldShowWarning: false,
          actionType: 'new'
        };
      }

      if (!existingRequests || existingRequests.length === 0) {
        return {
          hasExisting: false,
          canResume: false,
          needsPayment: false,
          shouldShowWarning: false,
          actionType: 'new'
        };
      }

      const existingRequest = {
        ...existingRequests[0],
        selected_addons: existingRequests[0].selected_addons as Array<{ name: string; price: number; quantity: number }>
      } as ExistingCommissionWithDetails;
      const status = existingRequest.status;

      // Determine the appropriate action based on status
      switch (status) {
        case 'pending':
          return {
            hasExisting: true,
            existingRequest,
            canResume: true,
            needsPayment: false,
            shouldShowWarning: false,
            actionType: 'resume',
            message: 'You have a pending request for this commission type. Would you like to view it or create a new one?'
          };

        case 'payment_pending':
          return {
            hasExisting: true,
            existingRequest,
            canResume: false,
            needsPayment: true,
            shouldShowWarning: false,
            actionType: 'payment',
            message: 'You have an unpaid request for this commission type. Please complete the payment.'
          };

        case 'payment_failed':
          return {
            hasExisting: true,
            existingRequest,
            canResume: true,
            needsPayment: true,
            shouldShowWarning: false,
            actionType: 'payment',
            message: 'Your previous payment failed. Would you like to retry payment or create a new request?'
          };

        case 'accepted':
          return {
            hasExisting: true,
            existingRequest,
            canResume: false,
            needsPayment: false,
            shouldShowWarning: true,
            actionType: 'warning',
            message: 'You already have an accepted commission of this type. Creating another may result in delays.'
          };

        default:
          return {
            hasExisting: false,
            canResume: false,
            needsPayment: false,
            shouldShowWarning: false,
            actionType: 'new'
          };
      }
    },
    enabled: !!user?.id && !!commissionTypeId && !!creatorId,
    staleTime: 30000, // 30 seconds
  });
};