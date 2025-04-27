
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown } from 'lucide-react';

import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from '@/components/ui/sidebar';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function AppSidebar() {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [isCreatorStudioExpanded, setIsCreatorStudioExpanded] = useState(false);

  useEffect(() => {
    const isCreatorStudioRoute = location.pathname.startsWith('/creator-studio');
    setIsCreatorStudioExpanded(isCreatorStudioRoute);
  }, [location.pathname]);

  if (loading) {
    return <div>Loading sidebar...</div>;
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center justify-center p-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="text-primary text-xl">FanRealms</span>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pb-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              isActive={location.pathname === '/explore'}
              tooltip="Explore"
            >
              <Link to="/explore">Explore</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              isActive={location.pathname === '/community'}
              tooltip="Community"
            >
              <Link to="/community">Community</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              isActive={location.pathname === '/notifications'}
              tooltip="Notifications"
            >
              <Link to="/notifications">Notifications</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              isActive={location.pathname === '/purchases'}
              tooltip="Purchases"
            >
              <Link to="/purchases">Purchases</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              isActive={location.pathname === '/settings'}
              tooltip="Settings"
            >
              <Link to="/settings">Settings</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarSeparator />

          <SidebarMenuItem>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="creator-studio" className="border-none">
                <AccordionTrigger 
                  className={cn(
                    "flex h-8 w-full items-center justify-between px-2 py-0 text-sm hover:bg-accent hover:no-underline",
                    isCreatorStudioExpanded && "bg-accent"
                  )}
                >
                  Creator Studio
                  <ChevronDown className="h-4 w-4" />
                </AccordionTrigger>
                <AccordionContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location.pathname === '/creator-studio'}
                        tooltip="Dashboard"
                      >
                        <Link to="/creator-studio">Dashboard</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location.pathname === '/creator-studio/posts'}
                        tooltip="Posts"
                      >
                        <Link to="/creator-studio/posts">Posts</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location.pathname === '/creator-studio/tiers'}
                        tooltip="Membership Tiers"
                      >
                        <Link to="/creator-studio/tiers">Membership Tiers</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location.pathname === '/creator-studio/subscribers'}
                        tooltip="Subscribers"
                      >
                        <Link to="/creator-studio/subscribers">Subscribers</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location.pathname === '/creator-studio/payouts'}
                        tooltip="Payouts"
                      >
                        <Link to="/creator-studio/payouts">Payouts</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location.pathname === '/creator-studio/settings'}
                        tooltip="Settings"
                      >
                        <Link to="/creator-studio/settings">Settings</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarMenuItem>

          <SidebarSeparator />

          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Logout">
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <p className="px-2 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FanRealms
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
