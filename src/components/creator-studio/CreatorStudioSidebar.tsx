
import { NavLink } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import {
  LayoutDashboard,
  FileText,
  Users,
  WalletCards,
  Settings,
  Crown
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2 rounded-md transition-colors
        ${isActive 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }
      `}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export function CreatorStudioSidebar() {
  const navItems = [
    { to: '/creator-studio', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/creator-studio/posts', icon: FileText, label: 'Posts' },
    { to: '/creator-studio/tiers', icon: Crown, label: 'Membership Tiers' },
    { to: '/creator-studio/subscribers', icon: Users, label: 'Subscribers' },
    { to: '/creator-studio/payouts', icon: WalletCards, label: 'Payouts' },
    { to: '/creator-studio/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <Card className="p-3 h-full">
      <div className="mb-6">
        <h2 className="font-semibold text-lg px-3 mb-2">Creator Studio</h2>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>
    </Card>
  );
}
