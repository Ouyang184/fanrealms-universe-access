
import { Link } from "react-router-dom";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoginForm from "@/components/auth/LoginForm";
import SocialLoginOptions from "@/components/auth/SocialLoginOptions";
import AuthFooter from "@/components/auth/AuthFooter";

const Login = () => {
  const { isChecking } = useAuthCheck(false, '/dashboard');

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
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center text-gray-400">Sign in to your FanRealms account</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <SocialLoginOptions />
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <AuthFooter />
    </div>
  );
};

export default Login;
