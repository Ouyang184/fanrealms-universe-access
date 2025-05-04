
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
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 cursor-pointer",
        className
      )}
    >
      {/* Icon placeholder - would be replaced with actual image when available */}
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
        FR
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <h1 className="text-sm font-semibold">
            <span className="text-foreground">Fan</span>
            <span className="text-primary">Realms</span>
          </h1>
          <p className="text-[10px] text-muted-foreground">CREATOR PLATFORM</p>
        </div>
      )}
    </div>
  );
}
