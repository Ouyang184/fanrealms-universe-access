
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from '@/components/ui/sidebar';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

export function CreatorStudioMenu() {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    const isCreatorStudioRoute = location.pathname.startsWith('/creator-studio');
    setIsExpanded(isCreatorStudioRoute);
  }, [location.pathname]);
  
  return (
    <SidebarMenuItem>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="creator-studio" className="border-none">
          <AccordionTrigger 
            className={cn(
              "flex h-8 w-full items-center justify-between px-2 py-0 text-sm hover:bg-accent hover:no-underline",
              isExpanded && "bg-accent"
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
  );
}
