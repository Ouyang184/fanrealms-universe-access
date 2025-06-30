
import { Calendar, BarChart3, Users, Settings, CreditCard, Bell, FileText, User, Home } from "lucide-react";
import { SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";

const creatorStudioItems = [
  {
    title: "Dashboard",
    url: "/creator-studio",
    icon: Home,
  },
  {
    title: "Posts",
    url: "/creator-studio/posts", 
    icon: FileText,
  },
  {
    title: "Content Calendar",
    url: "/creator-studio/content-calendar",
    icon: Calendar,
  },
  {
    title: "Subscribers",
    url: "/creator-studio/subscribers",
    icon: Users,
  },
  {
    title: "Membership Tiers",
    url: "/creator-studio/membership-tiers",
    icon: CreditCard,
  },
  {
    title: "Profile",
    url: "/creator-studio/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/creator-studio/settings",
    icon: Settings,
  },
  {
    title: "Notifications",
    url: "/creator-studio/notifications",
    icon: Bell,
  },
  {
    title: "Payouts",
    url: "/creator-studio/payouts",
    icon: BarChart3,
  },
];

interface CreatorStudioMenuProps {
  collapsed?: boolean;
}

export function CreatorStudioMenu({ collapsed = false }: CreatorStudioMenuProps) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {creatorStudioItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <NavLink 
                to={item.url}
                end={item.url === "/creator-studio"}
                className={({ isActive }) =>
                  isActive ? "bg-accent text-accent-foreground font-medium" : ""
                }
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
