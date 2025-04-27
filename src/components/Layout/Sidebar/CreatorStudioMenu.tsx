
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SidebarMenu, 
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const creatorStudioItems = [
  { label: 'Dashboard', path: '/creator-studio' },
  { label: 'Posts', path: '/creator-studio/posts' },
  { label: 'Membership Tiers', path: '/creator-studio/tiers' },
  { label: 'Subscribers', path: '/creator-studio/subscribers' },
  { label: 'Payouts', path: '/creator-studio/payouts' },
  { label: 'Settings', path: '/creator-studio/settings' },
];

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
          <CollapsibleTrigger className="flex h-9 w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent">
            <span className="flex items-center gap-3">Creator Studio</span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down space-y-1 px-1 py-2">
            {creatorStudioItems.map((item) => (
              <SidebarMenuButton
                key={item.path}
                asChild
                isActive={location.pathname === item.path}
                className="w-full pl-8"
              >
                <Link to={item.path} className="flex items-center gap-3 px-3 py-2">
                  {item.label}
                </Link>
              </SidebarMenuButton>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
