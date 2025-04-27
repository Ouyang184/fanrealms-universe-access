
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function CreatorStudioMenu() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const isCreatorStudioRoute = location.pathname.startsWith('/creator-studio');
    setIsOpen(isCreatorStudioRoute);
  }, [location.pathname]);
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="w-full"
        >
          <CollapsibleTrigger className="flex h-8 w-full items-center justify-between rounded-md px-2 py-0 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <span>Creator Studio</span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "transform rotate-180"
              )} 
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down">
            <div className="pl-4 mt-1 space-y-1">
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === '/creator-studio'}
                >
                  <Link to="/creator-studio">Dashboard</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === '/creator-studio/posts'}
                >
                  <Link to="/creator-studio/posts">Posts</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === '/creator-studio/tiers'}
                >
                  <Link to="/creator-studio/tiers">Membership Tiers</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === '/creator-studio/subscribers'}
                >
                  <Link to="/creator-studio/subscribers">Subscribers</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === '/creator-studio/payouts'}
                >
                  <Link to="/creator-studio/payouts">Payouts</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === '/creator-studio/settings'}
                >
                  <Link to="/creator-studio/settings">Settings</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
