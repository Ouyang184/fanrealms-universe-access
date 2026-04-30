import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, Check } from "lucide-react";
import { Turnstile } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '@/config/turnstile';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import SocialLoginOptions from "@/components/auth/SocialLoginOptions";
import AuthFooter from "@/components/auth/AuthFooter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import TermsModal from "@/components/auth/TermsModal";

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
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: "You must agree to the Terms of Service to continue"
    }),
    captcha: z.string().min(1, "Please complete the captcha"),
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const { isChecking } = useAuthCheck(false, "/dashboard");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      agreeToTerms: false,
      captcha: "",
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

      const result = await signUp(values.email, values.password, values.captcha, values.fullName);

      if (result.success === false) {
        toast.error(result.error.message);
        return;
      }

      localStorage.setItem("user_fullname", values.fullName);

      // Email confirmation required — no session yet. Show confirm-email screen.
      if (result.needsEmailConfirmation || !result.session) {
        setPendingEmail(values.email);
        return;
      }

      // Session already active (email confirmation disabled in Supabase).
      toast.success("Account created successfully!");
      navigate("/dashboard", { replace: true });

    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error?.message || "An error occurred during signup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTermsAccept = () => {
    form.setValue("agreeToTerms", true);
    setShowTermsModal(false);
  };

  const handleTermsDecline = () => {
    form.setValue("agreeToTerms", false);
    setShowTermsModal(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (pendingEmail) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="text-[22px] font-bold tracking-[-0.5px] text-[#111]">FanRealms</h1>
            </Link>
          </div>

          <Card className="bg-white border border-[#eee] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-[20px] font-bold tracking-[-0.5px] text-[#111]">
                Check your email
              </CardTitle>
              <CardDescription className="text-[13px] text-[#888] mt-2">
                We sent a confirmation link to{" "}
                <span className="font-semibold text-[#111]">{pendingEmail}</span>.
                Click the link in the email to activate your account, then you can sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="bg-primary/5 border-primary/20">
                <AlertDescription className="text-[12px] text-[#555] leading-relaxed">
                  Didn't get the email? Check your spam folder, or wait a minute and try again.
                  The link will expire in 24 hours.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPendingEmail(null);
                  form.reset();
                }}
              >
                Use a different email
              </Button>
              <Link to="/login" className="block">
                <Button className="w-full bg-primary hover:bg-[#3a7aab] text-white">
                  Go to sign in
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
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-[22px] font-bold tracking-[-0.5px] text-[#111]">FanRealms</h1>
          </Link>
        </div>

        <Card className="bg-white border border-[#eee] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[20px] font-bold tracking-[-0.5px] text-center text-[#111]">Create your account</CardTitle>
            <CardDescription className="text-[13px] text-center text-[#888] mt-1">
              Join FanRealms to support your favorite creators
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="fullName" className="text-[13px] font-semibold text-[#111]">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-[#aaa]" />
                        <FormControl>
                          <Input
                            id="fullName"
                            placeholder="John Doe"
                            type="text"
                            autoComplete="name"
                            className="pl-10 bg-white border-[#e5e5e5] text-[#111] focus-visible:ring-primary"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="email" className="text-[13px] font-semibold text-[#111]">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-[#aaa]" />
                        <FormControl>
                          <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                            className="pl-10 bg-white border-[#e5e5e5] text-[#111] focus-visible:ring-primary"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="password" className="text-[13px] font-semibold text-[#111]">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-[#aaa]" />
                        <FormControl>
                          <Input
                            id="password"
                            placeholder="Create a strong password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className="pl-10 bg-white border-[#e5e5e5] text-[#111] focus-visible:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8 text-[#aaa] hover:text-[#111] hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                        </Button>
                      </div>
                      <FormMessage />

                      {password && (
                        <div className="mt-2 space-y-2">
                          <div className="flex gap-1">
                            <div className={`h-1 flex-1 rounded-full ${passwordStrength > 0 ? "bg-red-500" : "bg-[#eee]"}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${passwordStrength > 1 ? "bg-yellow-500" : "bg-[#eee]"}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${passwordStrength > 2 ? "bg-green-500" : "bg-[#eee]"}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${passwordStrength > 3 ? "bg-green-500" : "bg-[#eee]"}`}></div>
                          </div>

                          <ul className="text-[11px] space-y-1 text-[#888]">
                            <li className="flex items-center gap-1">
                              {hasMinLength ? <Check className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-[#ccc]" />}
                              At least 8 characters
                            </li>
                            <li className="flex items-center gap-1">
                              {hasUppercase ? <Check className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-[#ccc]" />}
                              At least one uppercase letter
                            </li>
                            <li className="flex items-center gap-1">
                              {hasNumber ? <Check className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-[#ccc]" />}
                              At least one number
                            </li>
                            <li className="flex items-center gap-1">
                              {hasSpecialChar ? <Check className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-[#ccc]" />}
                              At least one special character
                            </li>
                          </ul>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start space-x-3">
                        <FormControl>
                          <Checkbox
                            id="agreeToTerms"
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="flex-1">
                          <Label htmlFor="agreeToTerms" className="text-[13px] text-[#555] leading-relaxed">
                            I agree to the{" "}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                setShowTermsModal(true);
                              }}
                              className="text-primary hover:text-[#3a7aab] underline font-semibold"
                            >
                              Terms of Service
                            </button>
                          </Label>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="captcha"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-[13px] font-semibold text-[#111]">Security Check</Label>
                      <FormControl>
                        <Turnstile
                          siteKey={TURNSTILE_SITE_KEY}
                          onSuccess={(token) => { setCaptchaToken(token); field.onChange(token); }}
                          onError={() => { setCaptchaToken(""); field.onChange(""); }}
                          onExpire={() => { setCaptchaToken(""); field.onChange(""); }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="bg-primary/5 border-primary/20 text-[#555]">
                  <AlertDescription className="text-[11px] leading-relaxed">
                    By signing up, you'll receive updates about your account, new features, and creator content you follow.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold"
                  disabled={isSubmitting || passwordStrength < 3 || !captchaToken}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Creating account...
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

            <SocialLoginOptions />
          </CardContent>
          
          <CardFooter className="flex justify-center border-t border-[#f5f5f5] pt-5">
            <p className="text-[13px] text-[#888]">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-[#3a7aab] font-semibold">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <AuthFooter />

      <TermsModal
        open={showTermsModal}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
    </div>
  );
};

export default Signup;
