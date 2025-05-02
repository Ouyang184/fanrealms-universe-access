
import { ReactNode } from 'react';
import { MainLayout as AppMainLayout } from '@/components/Layout/MainLayout';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface MainLayoutProps {
  children: ReactNode;
  showTabs?: boolean;
  hideTopBar?: boolean;
}

export function MainLayout({ children, showTabs, hideTopBar }: MainLayoutProps) {
  return (
    <AppMainLayout showTabs={showTabs} hideTopBar={hideTopBar}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          {children}
        </div>
      </div>
    </AppMainLayout>
  );
}
