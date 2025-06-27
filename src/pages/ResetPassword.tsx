
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const checkResetSession = async () => {
      console.log("ResetPassword: Checking for valid reset session");
      
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("ResetPassword: Session check result:", { 
          hasSession: !!session, 
          error: sessionError?.message,
          user: session?.user?.email
        });

        if (sessionError) {
          console.error("ResetPassword: Session error:", sessionError);
          setError("There was a problem with your reset link. Please request a new password reset.");
          setIsLoading(false);
          return;
        }

        if (!session || !session.user) {
          console.log("ResetPassword: No valid session found");
          setError("This password reset link is invalid or has expired. Please request a new one.");
          setIsLoading(false);
          // Redirect after showing error
          setTimeout(() => {
            navigate('/forgot-password', { replace: true });
          }, 3000);
          return;
        }

        // Valid session found
        console.log("ResetPassword: Valid session found for password reset");
        setHasValidSession(true);
        setIsLoading(false);
        
      } catch (error: any) {
        console.error("ResetPassword: Unexpected error:", error);
        setError("An unexpected error occurred. Please try requesting a new password reset.");
        setIsLoading(false);
        setTimeout(() => {
          navigate('/forgot-password', { replace: true });
        }, 3000);
      }
    };

    checkResetSession();
  }, [navigate]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!hasValidSession) {
      setError("Invalid session. Please request a new password reset.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log("ResetPassword: Attempting to update password");

      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password
      });

      if (updateError) {
        console.error("ResetPassword: Password update error:", updateError);
        throw updateError;
      }

      console.log("ResetPassword: Password updated successfully");
      setIsSuccess(true);
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });

      // Sign out the user after password reset
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error("Password update error:", error);
      setError(error.message || "An error occurred while updating your password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-gray-900 border-gray-800 text-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold">Password Updated!</CardTitle>
              <CardDescription className="text-gray-400">
                Your password has been successfully updated. You'll be redirected to login shortly.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Set New Password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              {isLoading ? "Verifying your reset link..." : "Enter your new password below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-gray-400">Verifying your reset link...</p>
              </div>
            ) : hasValidSession && !error ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <FormControl>
                            <Input
                              id="password"
                              placeholder="••••••••"
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
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <FormControl>
                            <Input
                              id="confirmPassword"
                              placeholder="••••••••"
                              type={showConfirmPassword ? "text" : "password"}
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Updating password...
                      </div>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </Form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
