import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function AppSidebar() {
  const { user, profile, loading, logout } = useAuth();
  const location = useLocation();
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [isCreatorStudioExpanded, setIsCreatorStudioExpanded] = useState(false);

  useEffect(() => {
    // Check if the current route is under Creator Studio to expand the section
    const isCreatorStudioRoute = location.pathname.startsWith('/creator-studio');
    setIsCreatorStudioExpanded(isCreatorStudioRoute);
  }, [location.pathname]);

  const toggleProfileExpansion = () => {
    setIsProfileExpanded(!isProfileExpanded);
  };

  const toggleCreatorStudioExpansion = () => {
    setIsCreatorStudioExpanded(!isCreatorStudioExpanded);
  };

  if (loading) {
    return <div>Loading sidebar...</div>;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="space-y-2">
        <div className="flex items-center justify-center p-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.profile_picture || undefined} alt={profile?.username || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline">FanRealms</span>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              isActive={location.pathname === '/dashboard'}
              tooltip="Dashboard"
            >
              <Link to="/dashboard">Dashboard</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
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

          <SidebarSeparator />

          <SidebarMenuItem>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="creator-studio">
                <AccordionTrigger 
                  className="group-data-[collapsible=icon]:hidden"
                  onClick={toggleCreatorStudioExpansion}
                >
                  Creator Studio
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200 peer-data-[state=open]:rotate-180")}/>
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
            <SidebarMenuButton 
              asChild
              isActive={location.pathname === '/settings'}
              tooltip="Settings"
            >
              <Link to="/settings">Settings</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => logout()} tooltip="Logout">
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
