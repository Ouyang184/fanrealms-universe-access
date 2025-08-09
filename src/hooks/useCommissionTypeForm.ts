
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { toast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  description: string;
  base_price: number;
  estimated_turnaround_days: number;
  max_revisions: number;
  price_per_revision?: number;
  price_per_character?: number;
  dos: string[];
  donts: string[];
  sample_art_url?: string;
  tags?: string[];
}

export function useCommissionTypeForm(onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dos, setDos] = useState<string[]>([]);
  const [donts, setDonts] = useState<string[]>([]);
  const [currentDo, setCurrentDo] = useState('');
  const [currentDont, setCurrentDont] = useState('');

  const { creatorProfile } = useCreatorProfile();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const addDo = () => {
    if (currentDo.trim() && !dos.includes(currentDo.trim())) {
      setDos([...dos, currentDo.trim()]);
      setCurrentDo('');
    }
  };

  const addDont = () => {
    if (currentDont.trim() && !donts.includes(currentDont.trim())) {
      setDonts([...donts, currentDont.trim()]);
      setCurrentDont('');
    }
  };

  const removeDo = (index: number) => {
    setDos(dos.filter((_, i) => i !== index));
  };

  const removeDont = (index: number) => {
    setDonts(donts.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData, sampleArtUrl: string | null, tags?: string[]) => {
    if (!creatorProfile?.id) {
      toast({
        title: "Error",
        description: "Creator profile not found",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const commissionData = {
        creator_id: creatorProfile.id,
        name: data.name,
        description: data.description,
        base_price: data.base_price,
        estimated_turnaround_days: data.estimated_turnaround_days,
        max_revisions: data.max_revisions,
        price_per_revision: data.price_per_revision || null,
        price_per_character: data.price_per_character || null,
        dos,
        donts,
        tags: tags ?? [],
        sample_art_url: sampleArtUrl,
        is_active: true
      };

      const { error } = await supabase
        .from('commission_types')
        .insert([commissionData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission type created successfully"
      });

      reset();
      setDos([]);
      setDonts([]);
      onSuccess();
    } catch (error) {
      console.error('Error creating commission type:', error);
      toast({
        title: "Error",
        description: "Failed to create commission type",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    reset();
    setDos([]);
    setDonts([]);
    setCurrentDo('');
    setCurrentDont('');
  };

  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    dos,
    donts,
    currentDo,
    currentDont,
    setCurrentDo,
    setCurrentDont,
    addDo,
    addDont,
    removeDo,
    removeDont,
    onSubmit,
    resetForm,
    creatorProfile
  };
}
