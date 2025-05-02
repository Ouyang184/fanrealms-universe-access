
import { ReactNode } from 'react';
import { MainLayout as AppMainLayout } from '@/components/Layout/MainLayout';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  showTabs?: boolean;
  hideTopBar?: boolean;
  className?: string;
}

export function MainLayout({ 
  children, 
  showTabs, 
  hideTopBar,
  className 
}: MainLayoutProps) {
  return (
    <AppMainLayout showTabs={showTabs} hideTopBar={hideTopBar}>
      <div className={cn("flex flex-col min-h-screen", className)}>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AppMainLayout>
  );
}
