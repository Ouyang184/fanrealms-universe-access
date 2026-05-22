import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import * as z from "zod";

const tierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(1, "Price must be at least $1"),
  features: z.string().min(1, "Features are required"),
});

type TierFormValues = z.infer<typeof tierSchema>;

export interface Tier {
  id: string;
  name: string;
  price: number;
  features: string[];
  subscriberCount?: number;
}

interface UseTierFormProps {
  editingTier?: Tier | null;
  onClose: () => void;
}

export function useTierForm({ editingTier, onClose }: UseTierFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: "",
      price: 5,
      features: "",
    }
  });

  // Update form when editingTier changes
  useEffect(() => {
    if (editingTier) {
      form.reset({
        name: editingTier.name,
        price: editingTier.price,
        features: editingTier.features.join("\n"),
      });
    } else {
      form.reset({
        name: "",
        price: 5,
        features: "",
      });
    }
  }, [editingTier, form]);

  const onSubmit = async (data: TierFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, get the creator ID for the current user
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (creatorError) {
        throw new Error("Could not find your creator profile");
      }
      
      const features = data.features.split("\n").filter(feature => feature.trim() !== "");
      
      if (editingTier) {
        // Update existing tier: edge function performs the DB update server-side with verified Stripe IDs
        const tierUpdateData = {
          name: data.name,
          price: data.price,
          features: features,
        };

        console.log('Updating existing Stripe product for tier:', editingTier.id);

        const { data: stripeResult, error: stripeError } = await supabase.functions.invoke('create-stripe-product', {
          body: {
            tierData: tierUpdateData,
            tierId: editingTier.id,
            isUpdate: true,
          },
        });

        if (stripeError) {
          console.error('Stripe product update error:', stripeError);
          throw new Error('Failed to update Stripe product: ' + stripeError.message);
        }

        if (!stripeResult?.success) {
          throw new Error('Failed to update Stripe product');
        }

        console.log('Tier updated successfully');

        toast({
          title: "Success",
          description: "Membership tier updated successfully",
        });
      } else {
        // Create new tier: edge function creates Stripe product/price AND inserts the tier row server-side
        const tierData = {
          name: data.name,
          price: data.price,
          features: features
        };

        console.log('Creating new Stripe product for tier:', tierData);

        const { data: stripeResult, error: stripeError } = await supabase.functions.invoke('create-stripe-product', {
          body: {
            tierData,
            isUpdate: false
          }
        });

        if (stripeError) {
          console.error('Stripe product creation error:', stripeError);
          throw new Error('Failed to sync with Stripe: ' + stripeError.message);
        }

        if (!stripeResult?.success) {
          throw new Error('Failed to create Stripe product');
        }

        console.log('Tier created successfully');

        toast({
          title: "Success",
          description: "New membership tier created successfully",
        });
      }

      
      // Refresh tiers data
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
      
      // Close modal and reset form
      onClose();
      form.reset();
    } catch (error: any) {
      console.error('Tier creation/update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
