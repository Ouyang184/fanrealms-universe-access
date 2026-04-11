import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Store, Gamepad2, PenTool, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";

interface CreatorStudioMenuProps {
  collapsed: boolean;
  onMobileNavClick?: () => void;
  isMobile?: boolean;
}

const CREATOR_ITEMS = [
  { path: "/creator-studio/dashboard", icon: BarChart3, label: "Dashboard" },
  { path: "/creator-studio/products", icon: Store, label: "My Products" },
  { path: "/games/my-games", icon: Gamepad2, label: "My Games" },
  { path: "/creator-studio/commissions", icon: PenTool, label: "Commissions" },
  { path: "/creator-studio/payouts", icon: DollarSign, label: "Earnings" },
];

export function CreatorStudioMenu({ collapsed, onMobileNavClick, isMobile = false }: CreatorStudioMenuProps) {
  const location = useLocation();
  const { creatorProfile, isLoading } = useCreatorProfile();

  if (isLoading || !creatorProfile) return null;

  return (
    <div className="py-2 border-t border-[#1a1a1a]">
      {(!collapsed || isMobile) && (
        <div className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
          Creator Studio
        </div>
      )}
      {CREATOR_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onMobileNavClick}
            className={cn(
              "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
              collapsed && !isMobile ? "justify-center" : "",
              isActive
                ? "bg-[#1f1f1f] text-white"
                : "text-[#666] hover:bg-[#1a1a1a] hover:text-[#ccc]"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}
