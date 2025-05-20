
import { cn } from '@/lib/utils';

interface SidebarFooterContentProps {
  collapsed?: boolean;
}

export function SidebarFooterContent({ collapsed = false }: SidebarFooterContentProps) {
  const currentYear = new Date().getFullYear();
  
  if (collapsed) {
    // Return empty div with just the border when collapsed
    return (
      <div className="px-2 py-4 border-t border-border/40"></div>
    );
  }
  
  return (
    <div className="px-4 py-4 border-t border-border/40">
      <p className="text-center text-xs text-muted-foreground">
        © {currentYear} FanRealms
      </p>
    </div>
  );
}
