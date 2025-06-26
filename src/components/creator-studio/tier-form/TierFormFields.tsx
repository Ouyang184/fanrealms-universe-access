
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

const tierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(1, "Price must be at least $1"),
  features: z.string().min(1, "Features are required"),
});

type TierFormValues = z.infer<typeof tierSchema>;

interface TierFormFieldsProps {
  form: UseFormReturn<TierFormValues>;
}

export function TierFormFields({ form }: TierFormFieldsProps) {
  return (
    <>
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
    </>
  );
}
