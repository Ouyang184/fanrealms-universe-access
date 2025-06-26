
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface TierFormData {
  title: string;
  price: number;
  description: string;
}

interface UseTierFormProps {
  creatorId?: string;
  tierId?: string;
  onSuccess?: () => void;
}

export const useTierForm = ({ creatorId, tierId, onSuccess }: UseTierFormProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<TierFormData>({
    defaultValues: {
      title: '',
      price: 0,
      description: ''
    }
  });

  const loadTierData = async (tierIdToLoad: string) => {
    if (!tierIdToLoad) return;

    try {
      setIsLoading(true);

      // Get creator data first
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user?.id as any)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
        return;
      }

      // Get tier data
      const { data: tierData, error: tierError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('id', tierIdToLoad as any)
        .single();

      if (tierError) {
        console.error('Error fetching tier:', tierError);
        return;
      }

      if (tierData) {
        form.reset({
          title: (tierData as any).title || '',
          price: (tierData as any).price || 0,
          description: (tierData as any).description || ''
        });
      }

    } catch (error) {
      console.error('Error loading tier data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStripeProductData = async (tierIdToGet: string) => {
    try {
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('stripe_product_id, stripe_price_id')
        .eq('id', tierIdToGet as any)
        .single();

      if (error) throw error;

      return {
        stripeProductId: (data as any)?.stripe_product_id,
        stripePriceId: (data as any)?.stripe_price_id
      };
    } catch (error) {
      console.error('Error fetching Stripe product data:', error);
      return { stripeProductId: null, stripePriceId: null };
    }
  };

  const archiveStripeProduct = async (tierIdToArchive: string) => {
    try {
      const { stripeProductId } = await getStripeProductData(tierIdToArchive);
      
      if (stripeProductId) {
        await supabase.functions.invoke('archive-stripe-product', {
          body: { productId: (stripeProductId as any) }
        });
      }
    } catch (error) {
      console.error('Error archiving Stripe product:', error);
    }
  };

  const updateTier = async (data: TierFormData) => {
    if (!tierId) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('membership_tiers')
        .update({
          title: data.title,
          price: data.price,
          description: data.description
        } as any)
        .eq('id', tierId as any);

      if (error) throw error;

      toast({
        title: "Tier updated",
        description: "Your membership tier has been successfully updated."
      });

      queryClient.invalidateQueries({ queryKey: ['membership-tiers'] });
      onSuccess?.();

    } catch (error: any) {
      console.error('Error updating tier:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update tier. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTier = async (data: TierFormData) => {
    if (!creatorId) return;

    try {
      setIsLoading(true);

      // Create Stripe product first
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-stripe-product', {
        body: {
          name: data.title,
          price: data.price,
          description: data.description
        }
      });

      if (stripeError) throw stripeError;

      // Create membership tier in database
      const { error } = await supabase
        .from('membership_tiers')
        .insert({
          creator_id: creatorId as any,
          title: data.title,
          price: data.price,
          description: data.description,
          stripe_product_id: stripeData?.product?.id as any,
          stripe_price_id: stripeData?.price?.id as any
        } as any);

      if (error) throw error;

      toast({
        title: "Tier created",
        description: "Your membership tier has been successfully created."
      });

      queryClient.invalidateQueries({ queryKey: ['membership-tiers'] });
      onSuccess?.();

    } catch (error: any) {
      console.error('Error creating tier:', error);
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create tier. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTier = async (tierIdToDelete: string) => {
    try {
      setIsDeleting(true);

      // Archive Stripe product first
      await archiveStripeProduct(tierIdToDelete);

      // Delete tier from database
      const { error } = await supabase
        .from('membership_tiers')
        .delete()
        .eq('id', tierIdToDelete as any);

      if (error) throw error;

      toast({
        title: "Tier deleted",
        description: "The membership tier has been successfully deleted."
      });

      queryClient.invalidateQueries({ queryKey: ['membership-tiers'] });
      onSuccess?.();

    } catch (error: any) {
      console.error('Error deleting tier:', error);
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete tier. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = async (data: TierFormData) => {
    if (tierId) {
      await updateTier(data);
    } else {
      await createTier(data);
    }
  };

  return {
    form,
    isLoading,
    isDeleting,
    onSubmit: form.handleSubmit(onSubmit),
    loadTierData,
    deleteTier
  };
};
