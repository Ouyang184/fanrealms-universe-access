
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      console.log("ForgotPassword: Sending reset email to:", values.email);

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("ForgotPassword: Reset email error:", error);
        throw error;
      }

      console.log("ForgotPassword: Reset email sent successfully");
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Handle rate limiting gracefully
      if (error.message?.includes("rate_limit") || error.message?.includes("rate limit")) {
        setError("Too many reset requests. Please wait a moment before trying again.");
      } else if (error.message?.includes("not found") || error.message?.includes("user not found")) {
        // For security, we still show success even if email doesn't exist
        setIsSuccess(true);
      } else {
        setError(error.message || "An error occurred while sending the reset email");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="text-2xl font-bold gradient-text">FanRealms</h1>
            </Link>
          </div>

          <Card className="bg-gray-900 border-gray-800 text-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
              <CardDescription className="text-gray-400">
                We've sent a password reset link to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                If you don't see the email in your inbox, check your spam folder. The link will expire in 1 hour.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">
                  Didn't receive the email?
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setIsSuccess(false);
                    setError(null);
                    form.reset();
                  }}
                >
                  Try again
                </Button>
              </div>
              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold gradient-text">FanRealms</h1>
          </Link>
        </div>

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Reset your password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
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

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input
                            id="email"
                            placeholder="you@example.com"
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

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
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
                      Sending reset link...
                    </div>
                  ) : (
                    "Send reset link"
                  )}
                </Button>

                <Link to="/login">
                  <Button variant="outline" className="w-full mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
