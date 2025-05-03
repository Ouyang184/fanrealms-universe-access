
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Logo({ collapsed = false, onClick, className }: LogoProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center focus:outline-none", 
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="text-primary font-bold text-lg">
        {collapsed ? "FR" : "FanRealms"}
      </div>
    </button>
  );
}
