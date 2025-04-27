
import { Loader } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner = ({ className = "" }: LoadingSpinnerProps) => {
  return <Loader className={`loading-spinner ${className}`} />;
};

export default LoadingSpinner;
