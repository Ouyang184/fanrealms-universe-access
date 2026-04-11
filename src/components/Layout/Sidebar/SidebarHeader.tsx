import { Logo } from "@/components/Logo";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div className={cn(
      "flex items-center border-b border-[#1f1f1f] flex-shrink-0",
      collapsed ? "justify-center px-2 py-4" : "justify-between px-4 py-4"
    )}>
      <Logo collapsed={collapsed} variant="dark" />
      <button
        onClick={onToggle}
        className="text-[#555] hover:text-white transition-colors hidden md:flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <PanelLeftOpen className="h-4 w-4" />
          : <PanelLeftClose className="h-4 w-4" />
        }
      </button>
    </div>
  );
}
