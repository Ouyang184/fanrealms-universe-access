import { ReactNode, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
}

const EXPLORE: Item[] = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/library', label: 'My library' },
];

const CREATE: Item[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/projects/new', label: 'Upload new project' },
  { to: '/dashboard/devlogs', label: 'Posts' },
  { to: '/dashboard/assets', label: 'Assets' },
  { to: '/dashboard/sales', label: 'Sales & bundles' },
];

// Static portion of sidebar paths (everything except the username-dependent
// "View profile" entry). Hoisted so we don't rebuild these arrays per render.
const STATIC_PATHS: string[] = [...EXPLORE, ...CREATE].map((i) => i.to);
const SETTINGS_PATH = '/settings';

function Section({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#aaa]">
      {label}
    </div>
  );
}

function matchesPrefix(path: string, to: string) {
  return path === to || path.startsWith(to.endsWith('/') ? to : to + '/');
}

function SidebarLink({
  to,
  label,
  activePath,
}: Item & { activePath: string | null }) {
  const isActive = activePath === to;

  return (
    <NavLink
      to={to}
      className={cn(
        'flex items-center px-3 py-1.5 mx-1 rounded-md text-[13px] font-medium transition-colors',
        isActive
          ? 'bg-[#f0f0f0] text-[#111]'
          : 'text-[#555] hover:bg-[#f5f5f5] hover:text-[#111]'
      )}
    >
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
    { to: username ? `/${username}` : '/dashboard', label: 'View profile' },
    { to: SETTINGS_PATH, label: 'Settings' },
  ];

  const location = useLocation();
  const path = location.pathname;
  const profilePath = ACCOUNT[0].to;

  // Keep the latest profile path in a ref so the memo below depends only on
  // pathname. The profile path is read lazily inside the memo when it actually
  // recomputes (i.e. on a route change), so a username arriving later just
  // updates the ref — it doesn't invalidate the memo on its own. The memo is
  // re-evaluated on the next route change, which is when the highlight matters.
  const profilePathRef = useRef(profilePath);
  profilePathRef.current = profilePath;

  const activePath = useMemo<string | null>(() => {
    const pp = profilePathRef.current;
    const allPaths =
      pp === '/dashboard'
        ? [...STATIC_PATHS, SETTINGS_PATH]
        : [...STATIC_PATHS, pp, SETTINGS_PATH];

    let winner: string | null = null;
    let winnerLen = -1;
    let winnerIdx = -1;
    for (let i = 0; i < allPaths.length; i++) {
      const p = allPaths[i];
      if (!matchesPrefix(path, p)) continue;
      if (
        winner === null ||
        p.length > winnerLen ||
        (p.length === winnerLen && i < winnerIdx)
      ) {
        winner = p;
        winnerLen = p.length;
        winnerIdx = i;
      }
    }
    return winner;
  }, [path]);

  return (
    <MainLayout fullWidth>
      <div className="flex gap-6 -mx-4 sm:-mx-6 -my-6 sm:-my-8 min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden md:block w-60 flex-shrink-0 border-r border-[#eee] bg-white py-4">
          <Section label="Explore" />
          {EXPLORE.map((it) => (
            <SidebarLink key={it.to} {...it} activePath={activePath} />
          ))}

          <Section label="Create" />
          {CREATE.map((it) => (
            <SidebarLink key={it.to} {...it} activePath={activePath} />
          ))}

          <Section label="Account" />
          {ACCOUNT.map((it) => (
            <SidebarLink key={it.label} {...it} activePath={activePath} />
          ))}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center px-3 py-1.5 mx-1 rounded-md text-[13px] font-medium text-[#555] hover:bg-[#f5f5f5] hover:text-[#111]"
          >
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
