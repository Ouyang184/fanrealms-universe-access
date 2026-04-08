
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoginForm from "@/components/auth/LoginForm";
import SocialLoginOptions from "@/components/auth/SocialLoginOptions";
import AuthFooter from "@/components/auth/AuthFooter";

const Login = () => {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) setIsReady(true);
  }, [loading]);

  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
            <CardTitle className="text-xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <SocialLoginOptions />
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <AuthFooter />
    </div>
  );
};

export default Login;
