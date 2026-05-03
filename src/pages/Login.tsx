import { Link } from "react-router-dom";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import SocialLoginOptions from "@/components/auth/SocialLoginOptions";
import AuthFooter from "@/components/auth/AuthFooter";

// Auth/profile redirect logic lives in AuthGuard (wrapping /login in
// App.tsx). This page just renders the form; the guard handles every
// "already-signed-in" / "profile-incomplete" decision exactly once.
const Login = () => {
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
            <SocialLoginOptions mode="login" />
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
