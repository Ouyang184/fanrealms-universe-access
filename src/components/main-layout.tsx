
import { ReactNode } from 'react';
import { MainLayout as AppMainLayout } from '@/components/Layout/MainLayout';

interface MainLayoutProps {
  children: ReactNode;
  showTabs?: boolean;
  hideTopBar?: boolean;
}

export function MainLayout({ children, showTabs, hideTopBar }: MainLayoutProps) {
  return (
    <AppMainLayout showTabs={showTabs} hideTopBar={hideTopBar}>
      {children}
    </AppMainLayout>
  );
}
