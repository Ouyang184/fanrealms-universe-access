
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { TermsAcceptanceField } from "./TermsAcceptanceField";
import { Control, UseFormWatch } from "react-hook-form";

interface SignupFormFieldsProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
}

export const SignupFormFields = ({ control, watch }: SignupFormFieldsProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const password = watch("password");

  return (
    <>
      <FormField
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <FormControl>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  type="text"
                  autoComplete="name"
                  className="pl-10 bg-gray-800 border-gray-700 focus-visible:ring-purple-500"
                  {...field}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <FormControl>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoComplete="email"
                  className="pl-10 bg-gray-800 border-gray-700 focus-visible:ring-purple-500"
                  {...field}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <FormControl>
                <Input
                  id="password"
                  placeholder="Create a strong password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="pl-10 bg-gray-800 border-gray-700 focus-visible:ring-purple-500"
                  {...field}
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </Button>
            </div>
            <FormMessage />
            <PasswordStrengthIndicator password={password} />
          </FormItem>
        )}
      />

      <TermsAcceptanceField control={control} />
    </>
  );
};
