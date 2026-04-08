
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div className={cn("p-3 flex items-center", collapsed ? "justify-center" : "justify-start")}>
      <Logo collapsed={collapsed} onClick={onToggle} />
    </div>
  );
}
