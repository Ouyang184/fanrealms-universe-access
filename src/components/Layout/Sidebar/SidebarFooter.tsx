import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed: boolean;
  onSignOut: () => void;
}

export function SidebarFooter({ collapsed, onSignOut }: SidebarFooterProps) {
  const { profile } = useAuth();

  const displayName = profile?.full_name || profile?.username || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="border-t border-[#1a1a1a] p-3 flex-shrink-0">
      <div className={cn(
        "flex items-center gap-3",
        collapsed ? "justify-center" : ""
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
          {profile?.profile_picture
            ? <img src={profile.profile_picture} alt="" className="w-full h-full rounded-lg object-cover" />
            : initials
          }
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#ccc] truncate">
                {displayName}
              </div>
              <div className="text-[11px] text-[#555] truncate">
                @{profile?.username}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/settings" className="text-[#444] hover:text-[#888] transition-colors p-1">
                <Settings className="h-3.5 w-3.5" />
              </Link>
              <button onClick={onSignOut} className="text-[#444] hover:text-[#888] transition-colors p-1">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
