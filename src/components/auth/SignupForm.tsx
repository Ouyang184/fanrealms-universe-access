
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";
import { SignupFormFields } from "./SignupFormFields";
import { useAuthFunctions } from "@/hooks/useAuthFunctions";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: "You must accept the Terms of Service to continue"
    }),
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export const SignupForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = useAuthFunctions();
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  const password = form.watch("password");
  const hasMinLength = password?.length >= 8;
  const hasUppercase = /[A-Z]/.test(password || "");
  const hasNumber = /[0-9]/.test(password || "");
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password || "");
  const passwordStrength = [hasMinLength, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;

  const onSubmit = async (values: SignupFormValues) => {
    try {
      setIsSubmitting(true);
      
      const validatedData = signupSchema.parse(values);
      console.log("Form validation passed:", validatedData);
      
      toast.info("Creating your account...", {
        description: "This may take up to 30 seconds due to Supabase traffic. Please be patient.",
        duration: 8000,
      });
      
      const result = await signUp(validatedData.email, validatedData.password);
      console.log('Signup result:', result);
      
      if (!result.success) {
        console.error('Signup failed:', result.error);
        
        if (result.error?.message?.includes('timeout') || result.error?.message?.includes('overloaded')) {
          toast.error("Server Timeout", {
            description: "Database has been optimized. Please wait 30 seconds and try again. If it persists, Supabase may be down.",
            duration: 10000,
          });
        }
        return;
      }
      
      localStorage.setItem("user_fullname", validatedData.fullName);
      navigate("/login", { replace: true });
      
    } catch (error: any) {
      console.error("Signup form error:", error);
      if (error.errors) {
        error.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else {
        toast.error(error?.message || "An error occurred during signup");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SignupFormFields control={form.control} watch={form.watch} />

        <Alert className="bg-purple-900/20 border-purple-800 text-purple-200">
          <AlertDescription className="text-xs">
            By signing up, you'll receive updates about your account, new features, and creator content you
            follow. Please check your email to verify your account after signing up.
          </AlertDescription>
        </Alert>

        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting || passwordStrength < 3}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Creating Account... (may take 30s)
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
};
