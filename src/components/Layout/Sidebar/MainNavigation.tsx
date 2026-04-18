import { Link, useLocation } from 'react-router-dom';
import { Store, Gamepad2, MessagesSquare, Briefcase, LayoutDashboard, Package } from "lucide-react";
import { cn } from "@/lib/utils";

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
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/dashboard/assets", icon: Package, label: "My Assets" },
];

function SectionLabel({ label, collapsed, isMobile }: { label: string; collapsed: boolean; isMobile: boolean }) {
  if (collapsed && !isMobile) return null;
  return (
    <div className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#444]">
      {label}
    </div>
  );
}

function NavItem({ path, icon: Icon, label, collapsed, isMobile, onClick }: {
  path: string; icon: React.ElementType; label: string;
  collapsed: boolean; isMobile: boolean; onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

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
  return (
    <div className="py-2">
      <SectionLabel label="Browse" collapsed={collapsed} isMobile={isMobile} />
      {DISCOVER_ITEMS.map((item) => (
        <NavItem key={item.path} {...item} collapsed={collapsed} isMobile={isMobile} onClick={onMobileNavClick} />
      ))}
      <SectionLabel label="Sell" collapsed={collapsed} isMobile={isMobile} />
      {ACCOUNT_ITEMS.map((item) => (
        <NavItem key={item.path} {...item} collapsed={collapsed} isMobile={isMobile} onClick={onMobileNavClick} />
      ))}
    </div>
  );
}
