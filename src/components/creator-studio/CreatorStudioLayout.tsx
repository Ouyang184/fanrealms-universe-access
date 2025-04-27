
import { Outlet } from 'react-router-dom';
import { CreatorStudioSidebar } from './CreatorStudioSidebar';
import { MainLayout } from '@/components/Layout/MainLayout';

export function CreatorStudioLayout() {
  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row w-full gap-4 py-6">
        <div className="w-full md:w-64 mb-4 md:mb-0">
          <CreatorStudioSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </MainLayout>
  );
}
