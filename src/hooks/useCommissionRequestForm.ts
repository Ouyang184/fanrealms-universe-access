
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
      console.error('No authenticated user found');
      toast({
        title: "Authentication Required",
        description: "Please sign in to request a commission",
        variant: "destructive"
      });
      return;
    }

    if (!formData.commission_type_id || !formData.description) {
      console.error('Missing required fields:', { 
        commission_type_id: formData.commission_type_id, 
        description: formData.description 
      });
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
        status: 'pending'
      };

      console.log('Creating commission request with data:', requestData);
      console.log('User ID:', user.id);
      console.log('Creator ID:', creatorId);

      const { data: newRequest, error } = await supabase
        .from('commission_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating commission request:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Provide more specific error messages based on the error
        let errorMessage = "Failed to submit commission request. Please try again.";
        
        if (error.code === '23505') {
          errorMessage = "A duplicate commission request was detected. Please try again.";
        } else if (error.code === '23503') {
          errorMessage = "Invalid commission type or creator. Please refresh and try again.";
        } else if (error.message.includes('row-level security')) {
          errorMessage = "Permission denied. Please ensure you're logged in and try again.";
        }
        
        throw new Error(errorMessage);
      }

      console.log('Commission request created successfully:', newRequest);
      console.log('New request ID:', newRequest.id);

      // Verify the commission was actually created by fetching it
      const { data: verifyRequest, error: verifyError } = await supabase
        .from('commission_requests')
        .select('id, status, customer_id, creator_id')
        .eq('id', newRequest.id)
        .single();

      if (verifyError) {
        console.error('Failed to verify commission creation:', verifyError);
        throw new Error("Commission was created but couldn't be verified. Please check your requests page.");
      }

      console.log('Commission verified successfully:', verifyRequest);

      toast({
        title: "Success!",
        description: "Your commission request has been submitted successfully"
      });

      resetForm();
      onSuccess();
      
      // Increase navigation delay to ensure database transaction is committed
      console.log('Navigating to payment page in 1 second...');
      setTimeout(() => {
        console.log('Navigating to:', `/commissions/${newRequest.id}/pay`);
        navigate(`/commissions/${newRequest.id}/pay`);
      }, 1000);

    } catch (error) {
      console.error('Error in commission request submission:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
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
