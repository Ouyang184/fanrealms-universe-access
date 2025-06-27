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
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const validateRecoverySession = async () => {
      console.log("ResetPassword: Starting session validation");
      
      try {
        // First check if we have URL parameters that indicate a recovery session
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type');
        
        console.log("ResetPassword: URL parameters", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          currentUrl
        });
        
        // If we have tokens in the URL, set the session
        if (accessToken && refreshToken && type === 'recovery') {
          console.log("ResetPassword: Setting session from URL tokens");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error("ResetPassword: Error setting session:", error);
            setError("Invalid or expired reset link. Please request a new password reset.");
            setTimeout(() => navigate('/forgot-password'), 3000);
            return;
          }
          
          if (data.session) {
            console.log("ResetPassword: Session set successfully");
            setHasValidSession(true);
          }
        } else {
          // Check if we already have a session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("ResetPassword: Session error:", error);
            setError("Invalid or expired reset link. Please request a new password reset.");
            setTimeout(() => navigate('/forgot-password'), 3000);
            return;
          }
          
          if (session?.user) {
            console.log("ResetPassword: Found existing session");
            setHasValidSession(true);
          } else {
            console.log("ResetPassword: No valid session found");
            setError("Invalid or expired reset link. Please request a new password reset.");
            setTimeout(() => navigate('/forgot-password'), 3000);
            return;
          }
        }
        
        setIsValidatingSession(false);
        
      } catch (error: any) {
        console.error("ResetPassword: Validation error:", error);
        setError("Invalid or expired reset link. Please request a new password reset.");
        setTimeout(() => navigate('/forgot-password'), 3000);
      }
    };

    validateRecoverySession();
  }, [navigate]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!hasValidSession) {
      setError("No valid session found. Please request a new password reset.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log("ResetPassword: Updating password");

      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) {
        if (error.message.includes("same_password") || error.message.includes("New password should be different")) {
          setError("Your new password must be different from your current password. Please choose a different password.");
          return;
        }
        throw error;
      }

      console.log("ResetPassword: Password updated successfully");
      setIsSuccess(true);
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. Redirecting to home...",
      });

      // Redirect to home after 2 seconds while keeping the user logged in
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error("Password update error:", error);
      setError(error.message || "An error occurred while updating your password");
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
              <CardTitle className="text-2xl font-bold">Password updated!</CardTitle>
              <CardDescription className="text-gray-400">
                Your password has been successfully updated. You'll be redirected to your home page shortly.
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
            <CardTitle className="text-2xl font-bold text-center">Set new password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              {isValidatingSession ? "Verifying your reset link..." : "Enter your new password below. Make sure it's different from your current password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isValidatingSession && !error && (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-400">Verifying your session...</p>
                  </div>
                )}

                {!isValidatingSession && !error && hasValidSession && (
                  <>
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
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Updating password...
                        </div>
                      ) : (
                        "Update password"
                      )}
                    </Button>
                  </>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
