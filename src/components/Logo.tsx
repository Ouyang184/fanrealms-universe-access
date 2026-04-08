
import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Logo({ collapsed = false, onClick, className }: LogoProps) {
  return (
    <div
      className={cn("flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-70", className)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <span className="text-lg font-bold tracking-tight">
        {collapsed ? "FR" : "FanRealms"}
      </span>
    </div>
  );
}
