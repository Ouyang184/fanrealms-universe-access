import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { SearchBar } from '../Header/SearchBar';
import { HeaderNotifications } from '../Header/HeaderNotifications';
import { UserDropdownMenu } from '../Header/UserDropdownMenu';
import { matchesPrefix, useNormalizedPath } from '@/hooks/usePathMatching';
import { buildLoginUrl } from '@/utils/auth-redirects';
import { useActiveJam, getJamStatus } from '@/hooks/useJam';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';

const NAV_ITEMS = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/games', label: 'Games' },
  { to: '/forum', label: 'Forum' },
  { to: '/jobs', label: 'Jobs' },
];

function DesktopNavLink({
  to,
  label,
  isActive,
}: {
  to: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      to={to}
      data-nav-item={to}
      data-active={isActive ? 'true' : 'false'}
      className={cn(
        'px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
        isActive ? 'text-[#111]' : 'text-[#666] hover:text-[#111]'
      )}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  to,
  label,
  isActive,
  onClick,
}: {
  to: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-md text-[14px] font-medium transition-colors',
        isActive
          ? 'bg-[#f5f5f5] text-[#111]'
          : 'text-[#555] hover:bg-[#fafafa] hover:text-[#111]'
      )}
    >
      {label}
    </Link>
  );
}

export function TopNav() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useNormalizedPath();
  const location = useLocation();
  const { data: activeJam } = useActiveJam();
  const jamStatus = activeJam ? getJamStatus(activeJam) : null;
  const showJam = jamStatus === 'upcoming' || jamStatus === 'active' || jamStatus === 'voting';
  const { isCreator } = useCreatorProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-[#eee] bg-white/95 backdrop-blur-sm">
      <div className="w-full flex items-center gap-4 px-4 sm:px-6 h-14">
        {/* Logo */}
        <Link to={user ? '/marketplace' : '/'} className="flex items-center flex-shrink-0">
          <Logo collapsed={false} variant="light" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV_ITEMS.map((item) => (
            <DesktopNavLink
              key={item.to}
              {...item}
              isActive={matchesPrefix(pathname, item.to)}
            />
          ))}
          {showJam && activeJam && (
            <Link
              to={`/jam/${activeJam.id}`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-semibold whitespace-nowrap text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              {jamStatus === 'voting' ? 'Vote Now' : 'Asset Pack Jam'}
              {(jamStatus === 'active' || jamStatus === 'voting') && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
              )}
            </Link>
          )}
          {isCreator && (
            <DesktopNavLink
              to="/dashboard"
              label="Dashboard"
              isActive={matchesPrefix(pathname, '/dashboard')}
            />
          )}
        </nav>

        {/* Search — flex-grow */}
        <div className="hidden sm:block flex-1 max-w-md ml-auto">
          <SearchBar />
        </div>

        {/* Right side: Upload + Notifications + User */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {user ? (
            <>
              {isCreator && (
                <Button
                  asChild
                  size="sm"
                  className="hidden sm:inline-flex bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold"
                >
                  <Link to="/dashboard/assets">
                    <Plus className="w-4 h-4 mr-1" />
                    Upload
                  </Link>
                </Button>
              )}
              <HeaderNotifications />
              <UserDropdownMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-[13px]">
                <Link to={buildLoginUrl(location.pathname, location.search)}>Log in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold"
              >
                <Link to={`/signup?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>Sign up</Link>
              </Button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 text-[#555]"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#eee] bg-white">
          <div className="w-full px-4 sm:px-6 py-3 flex flex-col gap-1">
            <div className="sm:hidden mb-2">
              <SearchBar />
            </div>
            {NAV_ITEMS.map((item) => (
              <MobileNavLink
                key={item.to}
                {...item}
                isActive={matchesPrefix(pathname, item.to)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            {showJam && activeJam && (
              <Link
                to={`/jam/${activeJam.id}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-[14px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
              >
                {jamStatus === 'voting' ? 'Vote Now' : 'Asset Pack Jam'}
                {(jamStatus === 'active' || jamStatus === 'voting') && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                  </span>
                )}
              </Link>
            )}
            {isCreator && (
              <>
                <MobileNavLink
                  to="/dashboard"
                  label="Dashboard"
                  isActive={matchesPrefix(pathname, '/dashboard')}
                  onClick={() => setMobileOpen(false)}
                />
                <Link
                  to="/dashboard/assets"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 px-3 py-2 rounded-md text-[14px] font-semibold bg-primary text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Upload an asset
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
