
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";

interface LoadingViewProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullHeight?: boolean;
  message?: string;
}

export function LoadingView({
  className,
  size = "md",
  fullHeight = true,
  message = "Loading..."
}: LoadingViewProps) {
  const spinnerSize = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      fullHeight ? "h-[calc(100vh-4rem)]" : "py-12", 
      className
    )}>
      <LoadingSpinner className={spinnerSize[size]} />
      {message && (
        <p className="mt-4 text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
