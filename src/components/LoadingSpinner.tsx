
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner = ({ className = "" }: LoadingSpinnerProps) => {
  return (
    <div className={cn("animate-spin rounded-full h-8 w-8 border-b-2 border-primary", className)} />
  );
};

export default LoadingSpinner;
