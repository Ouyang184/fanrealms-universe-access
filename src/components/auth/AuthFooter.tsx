
import { Link } from "react-router-dom";

const AuthFooter = () => {
  return (
    <p className="mt-8 text-center text-sm text-gray-500">
      By signing in, you agree to our{" "}
      <Link to="/terms" className="text-purple-400 hover:text-purple-300">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link to="/privacy" className="text-purple-400 hover:text-purple-300">
        Privacy Policy
      </Link>
      . See our{" "}
      <Link to="/cookie-policy" className="text-purple-400 hover:text-purple-300">
        Cookie Policy
      </Link>{" "}
      for information about cookies.
    </p>
  );
};

export default AuthFooter;
