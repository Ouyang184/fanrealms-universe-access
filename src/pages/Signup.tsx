
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AuthLayout from "@/components/AuthLayout";
import SocialLoginOptions from "@/components/auth/SocialLoginOptions";
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
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const { isChecking } = useAuthCheck(false, "/dashboard");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<SignupFormValues | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const password = form.watch("password");
  
  // Password strength checks
  const hasMinLength = password?.length >= 8;
  const hasUppercase = /[A-Z]/.test(password || "");
  const hasNumber = /[0-9]/.test(password || "");
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password || "");
  const passwordStrength = [hasMinLength, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;

  const onSubmit = async (values: SignupFormValues) => {
    // Store the signup data and show terms modal
    setPendingSignupData(values);
    setShowTermsModal(true);
  };

  const handleTermsAccept = async () => {
    if (!pendingSignupData) return;
    
    try {
      setIsSubmitting(true);
      setShowTermsModal(false);
      
      const result = await signUp(pendingSignupData.email, pendingSignupData.password);
      
      if (result.success === false) {
        toast.error(result.error.message);
        return;
      }
      
      // Store the user's full name to be saved during onboarding
      localStorage.setItem("user_fullname", pendingSignupData.fullName);
      
      // In the success case
      toast.success("Account created successfully!");
      navigate("/onboarding", { replace: true });
      
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error?.message || "An error occurred during signup");
    } finally {
      setIsSubmitting(false);
      setPendingSignupData(null);
    }
  };

  const handleTermsDecline = () => {
    setShowTermsModal(false);
    setPendingSignupData(null);
    // Exit to home page
    window.location.href = '/';
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <AuthLayout>
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
            <CardDescription className="text-center text-gray-400">
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
                  control={form.control}
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
                  control={form.control}
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

                      {password && (
                        <div className="mt-2 space-y-2">
                          <div className="flex gap-1">
                            <div
                              className={`h-1 flex-1 rounded-full ${passwordStrength > 0 ? "bg-red-500" : "bg-gray-700"}`}
                            ></div>
                            <div
                              className={`h-1 flex-1 rounded-full ${passwordStrength > 1 ? "bg-yellow-500" : "bg-gray-700"}`}
                            ></div>
                            <div
                              className={`h-1 flex-1 rounded-full ${passwordStrength > 2 ? "bg-green-500" : "bg-gray-700"}`}
                            ></div>
                            <div
                              className={`h-1 flex-1 rounded-full ${passwordStrength > 3 ? "bg-green-500" : "bg-gray-700"}`}
                            ></div>
                          </div>

                          <ul className="text-xs space-y-1 text-gray-400">
                            <li className="flex items-center gap-1">
                              {hasMinLength ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-gray-500" />
                              )}
                              At least 8 characters
                            </li>
                            <li className="flex items-center gap-1">
                              {hasUppercase ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-gray-500" />
                              )}
                              At least one uppercase letter
                            </li>
                            <li className="flex items-center gap-1">
                              {hasNumber ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-gray-500" />
                              )}
                              At least one number
                            </li>
                            <li className="flex items-center gap-1">
                              {hasSpecialChar ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-gray-500" />
                              )}
                              At least one special character
                            </li>
                          </ul>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <Alert className="bg-purple-900/20 border-purple-800 text-purple-200">
                  <AlertDescription className="text-xs">
                    By signing up, you'll receive updates about your account, new features, and creator content you
                    follow. You'll be asked to review and accept our Terms of Service before your account is created.
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
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Review Terms & Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            </Form>

            <SocialLoginOptions />
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </AuthLayout>

      <TermsModal 
        open={showTermsModal}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
    </>
  );
};

export default Signup;
