import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: "light" | "dark";
}

export function Logo({ collapsed = false, onClick, className, variant = "light" }: LogoProps) {
  const textColor = variant === "dark" ? "text-white" : "text-foreground";
  const accentColor = "text-primary";

  return (
    <div
      className={cn("flex items-center gap-2 cursor-pointer", className)}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) onClick();
      }}
      role="button"
      tabIndex={0}
      aria-label="FanRealms"
    >
      <svg width="28" height="28" viewBox="0 0 52 52" fill="none" aria-hidden="true" className="flex-shrink-0">
        <rect width="52" height="52" rx="10" fill="#E11D48"/>
        {/* left tall merlon */}
        <rect x="9"  y="10" width="7" height="9" rx="1.5" fill="white"/>
        {/* left short merlon */}
        <rect x="19" y="13" width="6" height="6" rx="1" fill="white"/>
        {/* center tall merlon */}
        <rect x="23" y="10" width="7" height="9" rx="1.5" fill="white"/>
        {/* right short merlon */}
        <rect x="33" y="13" width="6" height="6" rx="1" fill="white"/>
        {/* right tall merlon */}
        <rect x="37" y="10" width="7" height="9" rx="1.5" fill="white"/>
        {/* tower body */}
        <rect x="9" y="19" width="35" height="20" rx="1.5" fill="white"/>
        {/* window arch */}
        <rect x="22" y="23" width="9" height="7" rx="4.5" fill="#E11D48"/>
        {/* door */}
        <rect x="23" y="30" width="7" height="9" fill="#E11D48"/>
        <rect x="23" y="30" width="7" height="4" rx="3.5" fill="#E11D48"/>
      </svg>

      {!collapsed && (
        <span className="text-base font-bold tracking-tight leading-none">
          <span className={textColor}>Fan</span><span className="text-primary">Realms</span>
        </span>
      )}
    </div>
  );
}