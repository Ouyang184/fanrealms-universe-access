
import React from "react";
import { Fan } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Logo({ collapsed = false, onClick, className }: LogoProps) {
  return (
    <div
      className={cn("flex items-center gap-2 cursor-pointer transition-all duration-300 hover:opacity-80", className)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 shadow-md">
        <Fan className="h-5 w-5 text-white" />
        <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-pink-500 to-red-500 shadow-sm" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-none tracking-tight">
            Fan<span className="text-primary">Realms</span>
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">CREATOR PLATFORM</span>
        </div>
      )}
    </div>
  );
}
