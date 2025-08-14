
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { CommissionType } from '@/types/commission';
import { useNavigate } from 'react-router-dom';
import { useDraftStorage } from './useDraftStorage';

interface FormData {
  commission_type_id: string;
  title: string;
  description: string;
  budget_range_min: string;
  budget_range_max: string;
  deadline: string;
  customer_notes: string;
  selected_addons: Array<{ name: string; price: number; quantity: number }>;
  character_count: number;
}

interface UseCommissionRequestFormProps {
  commissionTypes: CommissionType[];
  creatorId: string;
  specificCommissionType?: CommissionType;
  onSuccess: () => void;
  initialData?: FormData;
  enableAutoSave?: boolean;
}

export function useCommissionRequestForm({
  commissionTypes,
  creatorId,
  specificCommissionType,
  onSuccess,
  initialData,
  enableAutoSave = true
}: UseCommissionRequestFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultFormData: FormData = {
    commission_type_id: specificCommissionType?.id || '',
    title: '',
    description: '',
    budget_range_min: '',
    budget_range_max: '',
    deadline: '',
    customer_notes: '',
    selected_addons: [],
    character_count: 1
  };

  const [formData, setFormData] = useState<FormData>(initialData || defaultFormData);
  
  const { saveDraft, clearDraft, draftExists } = useDraftStorage(
    creatorId, 
    specificCommissionType?.id || '', 
    user?.id
  );

  useEffect(() => {
    if (specificCommissionType) {
      setFormData(prev => ({
        ...prev,
        commission_type_id: specificCommissionType.id
      }));
    }
  }, [specificCommissionType]);

  // Auto-save draft when form data changes
  useEffect(() => {
    if (!enableAutoSave || !user?.id || !specificCommissionType?.id) return;
    
    // Don't save if form is mostly empty
    if (!formData.description.trim() && !formData.deadline && formData.selected_addons.length === 0) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      saveDraft(formData);
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(timeoutId);
  }, [formData, enableAutoSave, user?.id, specificCommissionType?.id, saveDraft]);

  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
    clearDraft();
  }, [clearDraft, defaultFormData]);

  const loadDraftData = useCallback((draftData: FormData) => {
    setFormData(draftData);
  }, []);

  const calculateTotalPrice = (selectedType: CommissionType, addons: Array<{ name: string; price: number; quantity: number }>, characterCount: number) => {
    let total = selectedType.base_price;
    
    // Add addon costs
    addons.forEach(addon => {
      total += addon.price * addon.quantity;
    });
    
    // Add character costs
    if (selectedType.price_per_character && characterCount > 1) {
      total += selectedType.price_per_character * (characterCount - 1);
    }
    
    return total;
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

      const totalPrice = calculateTotalPrice(selectedType, formData.selected_addons, formData.character_count);

      const requestData = {
        commission_type_id: formData.commission_type_id,
        customer_id: user.id,
        creator_id: creatorId,
        title: selectedType.name,
        description: formData.description,
        budget_range_min: null,
        budget_range_max: null,
        deadline: formData.deadline || null,
        customer_notes: formData.character_count > 1 ? `Character count: ${formData.character_count}` : null,
        agreed_price: totalPrice,
        selected_addons: formData.selected_addons,
        status: 'pending'
      };

      const { data: newRequest, error } = await supabase
        .from('commission_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your commission request has been submitted successfully"
      });

      clearDraft(); // Clear draft on successful submission
      resetForm();
      onSuccess();
      
      // Use setTimeout to ensure modal closes before navigation
      setTimeout(() => {
        // Use window.location.href to ensure top-level navigation (not in iframe context)
        window.location.href = `/commissions/${newRequest.id}/pay`;
      }, 100);

    } catch (error) {
      console.error('Error submitting commission request:', error);
      toast({
        title: "Error",
        description: "Failed to submit commission request. Please try again.",
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
    resetForm,
    loadDraftData,
    draftExists
  };
}
