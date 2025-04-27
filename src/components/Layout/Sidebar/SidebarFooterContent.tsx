
import { cn } from '@/lib/utils';

interface SidebarFooterContentProps {
  isCollapsed?: boolean;
}

export function SidebarFooterContent({ isCollapsed = false }: SidebarFooterContentProps) {
  const currentYear = new Date().getFullYear();
  
  if (isCollapsed) {
    return (
      <div className="px-2 py-2 text-center">
        <p className="text-xs text-muted-foreground">©{currentYear}</p>
      </div>
    );
  }
  
  return (
    <p className="px-2 py-2 text-center text-xs text-muted-foreground">
      © {currentYear} FanRealms
    </p>
  );
}
