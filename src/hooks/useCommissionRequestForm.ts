
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { CommissionType } from '@/types/commission';
import { useNavigate } from 'react-router-dom';

interface FormData {
  commission_type_id: string;
  title: string;
  description: string;
  budget_range_min: string;
  budget_range_max: string;
  deadline: string;
  customer_notes: string;
}

interface UseCommissionRequestFormProps {
  commissionTypes: CommissionType[];
  creatorId: string;
  specificCommissionType?: CommissionType;
  onSuccess: () => void;
}

export function useCommissionRequestForm({
  commissionTypes,
  creatorId,
  specificCommissionType,
  onSuccess
}: UseCommissionRequestFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    commission_type_id: specificCommissionType?.id || '',
    title: '',
    description: '',
    budget_range_min: '',
    budget_range_max: '',
    deadline: '',
    customer_notes: ''
  });

  useEffect(() => {
    if (specificCommissionType) {
      setFormData(prev => ({
        ...prev,
        commission_type_id: specificCommissionType.id
      }));
    }
  }, [specificCommissionType]);

  const resetForm = () => {
    setFormData({
      commission_type_id: specificCommissionType?.id || '',
      title: '',
      description: '',
      budget_range_min: '',
      budget_range_max: '',
      deadline: '',
      customer_notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request a commission",
        variant: "destructive"
      });
      return;
    }

    if (!formData.commission_type_id || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedType = specificCommissionType || commissionTypes.find(type => type.id === formData.commission_type_id);
      
      if (!selectedType) {
        throw new Error("Commission type not found");
      }

      console.log('Creating commission request with data:', {
        commission_type_id: formData.commission_type_id,
        customer_id: user.id,
        creator_id: creatorId,
        title: selectedType.name,
        description: formData.description,
        agreed_price: selectedType.base_price,
        status: 'accepted' // Changed from 'pending' to 'accepted' for fixed-price commissions
      });

      // Create the commission request with accepted status for immediate payment
      const requestData = {
        commission_type_id: formData.commission_type_id,
        customer_id: user.id,
        creator_id: creatorId,
        title: selectedType.name,
        description: formData.description,
        budget_range_min: null,
        budget_range_max: null,
        deadline: formData.deadline || null,
        customer_notes: formData.customer_notes || null,
        agreed_price: selectedType.base_price,
        status: 'accepted', // Set to accepted since we have a fixed price
        creator_notes: 'Commission auto-accepted with fixed price - payment required to begin work'
      };

      const { data: newRequest, error } = await supabase
        .from('commission_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) {
        console.error('Error creating commission request:', error);
        throw error;
      }

      console.log('Commission request created successfully:', newRequest);

      // Now create the payment session
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-commission-payment', {
        body: { commissionId: newRequest.id }
      });

      if (paymentError) {
        console.error('Payment creation error:', paymentError);
        // Clean up the commission request if payment fails
        await supabase.from('commission_requests').delete().eq('id', newRequest.id);
        throw new Error(paymentError.message || 'Failed to create payment session');
      }

      if (!paymentData?.url) {
        throw new Error('No payment URL received');
      }

      toast({
        title: "Commission Accepted!",
        description: "Complete payment to begin work on your commission"
      });

      resetForm();
      onSuccess();
      
      // Redirect to payment
      window.open(paymentData.url, '_blank');

    } catch (error) {
      console.error('Error submitting commission request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit commission request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
    resetForm
  };
}
