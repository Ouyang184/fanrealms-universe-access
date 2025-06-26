
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SocialLoginOptions from "@/components/auth/SocialLoginOptions";
import AuthFooter from "@/components/auth/AuthFooter";
import { SignupForm } from "@/components/auth/SignupForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";

const Signup = () => {
  const { isChecking } = useAuthCheck(false, "/dashboard");

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
            <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Join FanRealms to support your favorite creators
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert className="bg-amber-900/20 border-amber-800 text-amber-200 mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Database optimized! If signup times out, Supabase may be experiencing high traffic. Wait 30 seconds and try again.
              </AlertDescription>
            </Alert>

            <SignupForm />
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
      </div>

      <AuthFooter />
    </div>
  );
};

export default Signup;
