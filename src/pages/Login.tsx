
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import LoginForm from "@/components/LoginForm";

const Login = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="auth-title">Sign In to FanRealms</h2>
        </div>
        
        <LoginForm />

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
