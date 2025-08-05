
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '@/config/turnstile';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAuth } from "@/contexts/AuthContext";
import { AuthResult } from "@/lib/types/auth";
import { MFAChallenge } from "@/components/auth/MFAChallenge";
import { EmailTwoFactorChallenge } from "@/components/auth/EmailTwoFactorChallenge";
import { useMFA } from "@/hooks/useMFA";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional().default(false),
  captcha: z.string().min(1, "Please complete the captcha"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [showMFAChallenge, setShowMFAChallenge] = useState(false);
  const [showEmailMFAChallenge, setShowEmailMFAChallenge] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const [mfaChallengeId, setMfaChallengeId] = useState<string>("");
  const [emailMfaEmail, setEmailMfaEmail] = useState<string>("");
  const turnstileRef = useRef<any>(null);
  const { createChallenge } = useMFA();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
      captcha: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoginError(null);
      console.log("LoginForm: Attempting to sign in with:", values.email);
      
      const result: AuthResult = await signIn(values.email, values.password, values.captcha);
      
      if (result.success === false) {
        if (result.mfaRequired && result.factors?.length) {
          console.log("LoginForm: MFA challenge required");
          const factor = result.factors[0]; // Use first TOTP factor
          try {
            const challengeId = await createChallenge(factor.id);
            setMfaFactorId(factor.id);
            setMfaChallengeId(challengeId);
            setShowMFAChallenge(true);
          } catch (error: any) {
            setLoginError("Failed to create MFA challenge");
          }
          return;
        }
        
        if (result.emailMfaRequired && result.email) {
          console.log("LoginForm: Email 2FA challenge required");
          setEmailMfaEmail(result.email);
          setShowEmailMFAChallenge(true);
          return;
        }
        
        console.log("LoginForm: Sign in failed:", result.error.message);
        setLoginError(result.error.message);
        
        // Reset captcha on failed login attempts
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setCaptchaToken("");
        form.setValue("captcha", "");
        return;
      }
      
      console.log("LoginForm: Sign in successful, redirecting...");
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo');
      navigate(returnTo || '/home', { replace: true });
    } catch (error: any) {
      console.error("LoginForm: Login error:", error);
      setLoginError(error?.message || "Unexpected error occurred");
      
      // Reset captcha on error
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setCaptchaToken("");
      form.setValue("captcha", "");
    }
  };

  const handleMFASuccess = () => {
    console.log("LoginForm: MFA verification successful, redirecting...");
    const params = new URLSearchParams(location.search);
    const returnTo = params.get('returnTo');
    navigate(returnTo || '/home', { replace: true });
  };

  const handleMFACancel = () => {
    setShowMFAChallenge(false);
    setMfaFactorId("");
    setMfaChallengeId("");
  };

  const handleEmailMFASuccess = async () => {
    console.log("LoginForm: Email 2FA verification successful, completing login...");
    try {
      // Complete the login with email and password after 2FA verification
      const { data: authResult, error: authError } = await supabase.auth.signInWithPassword({
        email: emailMfaEmail,
        password: form.getValues("password")
      });

      if (authError || !authResult.user) {
        throw new Error(authError?.message || "Failed to complete login after 2FA");
      }

      // Clear 2FA state
      setShowEmailMFAChallenge(false);
      setEmailMfaEmail("");

      // Navigate to success page
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo');
      navigate(returnTo || '/home', { replace: true });
    } catch (error: any) {
      console.error("Failed to complete login after 2FA:", error);
      setLoginError("Failed to complete login. Please try again.");
      setShowEmailMFAChallenge(false);
      setEmailMfaEmail("");
    }
  };

  const handleEmailMFACancel = () => {
    setShowEmailMFAChallenge(false);
    setEmailMfaEmail("");
  };

  if (showMFAChallenge) {
    return (
      <MFAChallenge
        factorId={mfaFactorId}
        challengeId={mfaChallengeId}
        onSuccess={handleMFASuccess}
        onCancel={handleMFACancel}
      />
    );
  }

  if (showEmailMFAChallenge) {
    return (
        <EmailTwoFactorChallenge
          email={emailMfaEmail}
          password={form.getValues("password")}
          onSuccess={handleEmailMFASuccess}
          onCancel={handleEmailMFACancel}
        />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {loginError && (
          <Alert variant="destructive">
            <AlertDescription>{loginError}</AlertDescription>
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
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <FormControl>
                  <Input
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox 
                  id="remember" 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <Label htmlFor="remember" className="text-sm text-gray-400">
                Remember me for 30 days
              </Label>
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
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting || !captchaToken}>
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
              Signing in...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
