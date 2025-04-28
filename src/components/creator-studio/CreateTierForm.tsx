
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

interface CreateTierFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTier?: Tier | null;
}

export function CreateTierForm({ isOpen, onClose, editingTier }: CreateTierFormProps) {
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
        // Update existing tier
        const { error: updateError } = await supabase
          .from("membership_tiers")
          .update({
            title: data.name,
            price: data.price,
            description: features.join("|"), // Store features as pipe-separated string
          })
          .eq("id", editingTier.id);
        
        if (updateError) throw updateError;
        
        toast({
          title: "Success",
          description: "Membership tier updated successfully",
        });
      } else {
        // Create new tier
        const { error: insertError } = await supabase
          .from("membership_tiers")
          .insert({
            creator_id: creatorData.id,
            title: data.name,
            price: data.price,
            description: features.join("|"), // Store features as pipe-separated string
          });
        
        if (insertError) throw insertError;
        
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
      toast({
        title: "Error",
        description: error.message || "Failed to save tier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingTier ? "Edit Membership Tier" : "Create New Tier"}</DialogTitle>
          <DialogDescription>
            {editingTier 
              ? "Update the details of your membership tier."
              : "Define a new membership tier for your subscribers."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Premium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Price (USD)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      step="0.01"
                      placeholder="9.99" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Features (one per line)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Exclusive content
Early access
Monthly Q&A" 
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                {editingTier ? "Save Changes" : "Create Tier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
