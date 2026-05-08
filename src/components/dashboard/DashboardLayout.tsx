import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass, Library, Sparkles, LayoutDashboard, FileText, Upload,
  TrendingUp, Package, User, Settings, LogOut,
} from 'lucide-react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface Item {
  to: string;
  label: string;
  icon: typeof Compass;
}

const EXPLORE: Item[] = [
  { to: '/marketplace', label: 'Marketplace', icon: Compass },
  { to: '/dashboard', label: 'My library', icon: Library },
  { to: '/games', label: 'Recommendations', icon: Sparkles },
];

const CREATE: Item[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, },
  { to: '/dashboard/projects', label: 'Projects', icon: FileText },
  { to: '/dashboard/projects/new', label: 'Upload new project', icon: Upload },
  { to: '/dashboard/assets', label: 'Assets', icon: Package },
  { to: '/dashboard/sales', label: 'Sales & bundles', icon: TrendingUp },
];

function Section({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#aaa]">
      {label}
    </div>
  );
}

function SidebarLink({ to, label, icon: Icon, end }: Item & { end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-1.5 mx-1 rounded-md text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-[#f0f0f0] text-[#111]'
            : 'text-[#555] hover:bg-[#f5f5f5] hover:text-[#111]'
        )
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0 text-[#888]" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { data: usernameData } = useQuery({
    queryKey: ['dash-sidebar-username', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from('users').select('username').eq('id', user.id).maybeSingle();
      return data?.username ?? null;
    },
    enabled: !!user?.id,
  });
  const username = usernameData ?? null;

  const ACCOUNT: Item[] = [
    { to: username ? `/${username}` : '/dashboard', label: 'View profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <MainLayout fullWidth>
      <div className="flex gap-6 -mx-4 sm:-mx-6 -my-6 sm:-my-8 min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden md:block w-60 flex-shrink-0 border-r border-[#eee] bg-white py-4">
          <Section label="Explore" />
          {EXPLORE.map((it) => (
            <SidebarLink key={it.to} {...it} end={it.to === '/dashboard'} />
          ))}

          <Section label="Create" />
          {CREATE.map((it) => (
            <SidebarLink key={it.to} {...it} end={it.to === '/dashboard'} />
          ))}

          <Section label="Account" />
          {ACCOUNT.map((it) => (
            <SidebarLink key={it.label} {...it} />
          ))}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 mx-1 rounded-md text-[13px] font-medium text-[#555] hover:bg-[#f5f5f5] hover:text-[#111]"
          >
            <LogOut className="w-4 h-4 text-[#888]" />
            <span>Log out</span>
          </button>
        </aside>

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </MainLayout>
  );
}
