import { Link } from 'react-router-dom';
import { Store, Gamepad2, MessagesSquare, Briefcase, Library, LayoutDashboard, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivePath } from "@/hooks/usePathMatching";

interface MainNavigationProps {
  collapsed: boolean;
  onMobileNavClick?: () => void;
  isMobile?: boolean;
}

const DISCOVER_ITEMS = [
  { path: "/marketplace", icon: Store, label: "Marketplace" },
  { path: "/games", icon: Gamepad2, label: "Indie Games" },
  { path: "/forum", icon: MessagesSquare, label: "Forum" },
  { path: "/jobs", icon: Briefcase, label: "Jobs" },
];

const ACCOUNT_ITEMS = [
  { path: "/library", icon: Library, label: "My Library" },
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/dashboard/assets", icon: Package, label: "My Assets" },
];

const ALL_PATHS: string[] = [...DISCOVER_ITEMS, ...ACCOUNT_ITEMS].map((i) => i.path);

function SectionLabel({ label, collapsed, isMobile }: { label: string; collapsed: boolean; isMobile: boolean }) {
  if (collapsed && !isMobile) return null;
  return (
    <div className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#444]">
      {label}
    </div>
  );
}

function NavItem({ path, icon: Icon, label, collapsed, isMobile, onClick, isActive }: {
  path: string; icon: React.ElementType; label: string;
  collapsed: boolean; isMobile: boolean; onClick?: () => void; isActive: boolean;
}) {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
        collapsed && !isMobile ? "justify-center" : "",
        isActive
          ? "bg-[#1f1f1f] text-white"
          : "text-[#777] hover:bg-[#1a1a1a] hover:text-[#ccc]"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {(!collapsed || isMobile) && <span>{label}</span>}
      {isActive && (!collapsed || isMobile) && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export function MainNavigation({ collapsed, onMobileNavClick, isMobile = false }: MainNavigationProps) {
  const pathname = useNormalizedPath();

  // Longest-prefix winner so /dashboard/assets highlights "My Assets" only,
  // not both "Dashboard" and "My Assets". Matches DashboardLayout semantics.
  const activePath = useMemo<string | null>(() => {
    let winner: string | null = null;
    let winnerLen = -1;
    let winnerIdx = -1;
    for (let i = 0; i < ALL_PATHS.length; i++) {
      const p = ALL_PATHS[i];
      if (!matchesPrefix(pathname, p)) continue;
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
  }, [pathname]);

  return (
    <div className="py-2">
      <SectionLabel label="Browse" collapsed={collapsed} isMobile={isMobile} />
      {DISCOVER_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          {...item}
          collapsed={collapsed}
          isMobile={isMobile}
          onClick={onMobileNavClick}
          isActive={activePath === item.path}
        />
      ))}
      <SectionLabel label="Sell" collapsed={collapsed} isMobile={isMobile} />
      {ACCOUNT_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          {...item}
          collapsed={collapsed}
          isMobile={isMobile}
          onClick={onMobileNavClick}
          isActive={activePath === item.path}
        />
      ))}
    </div>
  );
}
