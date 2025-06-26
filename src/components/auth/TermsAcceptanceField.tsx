
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { TermsOfServiceModal } from "@/components/auth/TermsOfServiceModal";
import { Control } from "react-hook-form";

interface TermsAcceptanceFieldProps {
  control: Control<any>;
}

export const TermsAcceptanceField = ({ control }: TermsAcceptanceFieldProps) => {
  return (
    <FormField
      control={control}
      name="acceptTerms"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-start space-x-3 p-4 bg-gray-800 rounded-lg">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-1"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <label className="text-sm font-medium leading-relaxed cursor-pointer">
                I agree to the{" "}
                <TermsOfServiceModal>
                  <button
                    type="button"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Terms of Service
                  </button>
                </TermsOfServiceModal>
              </label>
              <p className="text-xs text-gray-400">
                Multiple accounts from the same location are allowed on FanRealms.
              </p>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
