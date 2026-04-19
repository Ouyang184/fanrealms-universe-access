import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { SearchBar } from '../Header/SearchBar';
import { HeaderNotifications } from '../Header/HeaderNotifications';
import { UserDropdownMenu } from '../Header/UserDropdownMenu';

const NAV_ITEMS = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/games', label: 'Games' },
  { to: '/forum', label: 'Forum' },
  { to: '/jobs', label: 'Jobs' },
];

function DesktopNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
          isActive
            ? 'text-[#111]'
            : 'text-[#666] hover:text-[#111]'
        )
      }
    >
      {label}
    </NavLink>
  );
}

export function TopNav() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#eee] bg-white/95 backdrop-blur-sm">
      <div className="w-full flex items-center gap-4 px-4 sm:px-6 h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <Logo collapsed={false} variant="light" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV_ITEMS.map((item) => (
            <DesktopNavLink key={item.to} {...item} />
          ))}
        </nav>

        {/* Search — flex-grow */}
        <div className="hidden sm:block flex-1 max-w-md ml-auto">
          <SearchBar />
        </div>

        {/* Right side: Upload + Notifications + User */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {user ? (
            <>
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
              <HeaderNotifications />
              <UserDropdownMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-[13px]">
                <Link to="/login">Log in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold"
              >
                <Link to="/signup">Sign up</Link>
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
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-md text-[14px] font-medium transition-colors',
                    isActive
                      ? 'bg-[#f5f5f5] text-[#111]'
                      : 'text-[#555] hover:bg-[#fafafa] hover:text-[#111]'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user && (
              <Link
                to="/dashboard/assets"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-3 py-2 rounded-md text-[14px] font-semibold bg-primary text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload an asset
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
