
import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <header className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold gradient-text">FanRealms</h1>
          </Link>
          <p className="text-muted-foreground mt-2">Connect with creators, unlock exclusive content</p>
        </header>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
