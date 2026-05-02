import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Turnstile } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '@/config/turnstile';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import AuthFooter from "@/components/auth/AuthFooter";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  captcha: z.string().min(1, "Please complete the captcha"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const turnstileRef = useRef<any>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      captcha: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken: values.captcha,
      });

      if (error) throw error;

      setIsSuccess(true);
    } catch (error: any) {
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken("");
      form.setValue("captcha", "");

      if (error.message?.includes("rate_limit") || error.message?.includes("rate limit")) {
        setError("Too many reset requests. Please wait a moment before trying again.");
      } else if (error.message?.includes("not found") || error.message?.includes("user not found")) {
        setIsSuccess(true);
      } else if (error.message?.includes("captcha")) {
        setError("Security verification failed. Please try again.");
      } else {
        setError(error.message || "An error occurred while sending the reset email");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link to="/" className="text-xl font-bold">FanRealms</Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription>
                We've sent a password reset link to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                If you don't see the email in your inbox, check your spam folder. The link will expire in 1 hour.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the email?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSuccess(false);
                    setError(null);
                    setCaptchaToken("");
                    form.reset();
                    if (turnstileRef.current) turnstileRef.current.reset();
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
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-bold">FanRealms</Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
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
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input
                            id="email"
                            placeholder="you@example.com"
                            type="email"
                            autoComplete="email"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="captcha"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label>Security Check</Label>
                      <FormControl>
                        <Turnstile
                          ref={turnstileRef}
                          siteKey={TURNSTILE_SITE_KEY}
                          onSuccess={(token) => {
                            setCaptchaToken(token);
                            field.onChange(token);
                          }}
                          onError={() => {
                            setCaptchaToken("");
                            field.onChange("");
                          }}
                          onExpire={() => {
                            setCaptchaToken("");
                            field.onChange("");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting || !captchaToken}>
                  {isSubmitting ? "Sending reset link..." : "Send reset link"}
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

      <AuthFooter />
    </div>
  );
};

export default ForgotPassword;
