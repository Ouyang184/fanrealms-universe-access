import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronDown, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SidebarMenu, 
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CreatorStudioMenuProps {
  isCollapsed?: boolean;
}

const creatorStudioItems = [
  { label: 'Dashboard', path: '/creator-studio' },
  { label: 'Posts', path: '/creator-studio/posts' },
  { label: 'Messages', path: '/creator-studio/messages' },
  { label: 'Membership Tiers', path: '/creator-studio/membership-tiers' },
  { label: 'Subscribers', path: '/creator-studio/subscribers' },
  { label: 'Payouts', path: '/creator-studio/payouts' },
  { label: 'Settings', path: '/creator-studio/settings' },
];

export function CreatorStudioMenu({ isCollapsed = false }: CreatorStudioMenuProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const isCreatorStudioRoute = location.pathname.startsWith('/creator-studio');
    setIsOpen(isCreatorStudioRoute);
  }, [location.pathname]);
  
  const creatorStudioIcon = (
    <PanelLeftClose className="h-5 w-5" />
  );

  if (isCollapsed) {
    return (
      <SidebarMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/creator-studio')}
                >
                  <Link to="/creator-studio" className="flex w-full justify-center px-2 py-2.5">
                    {creatorStudioIcon}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right">
              Creator Studio
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SidebarMenu>
    );
  }
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="w-full"
        >
          <CollapsibleTrigger className="flex h-10 w-full items-center justify-between rounded-md px-4 py-2.5 text-base transition-colors hover:bg-accent">
            <span className="flex items-center gap-3">Creator Studio</span>
            <ChevronDown 
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down space-y-1 py-2">
            {creatorStudioItems.map((item) => (
              <SidebarMenuButton
                key={item.path}
                asChild
                isActive={location.pathname === item.path}
                className="w-full pl-9 py-2"
              >
                <Link to={item.path} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-base">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
