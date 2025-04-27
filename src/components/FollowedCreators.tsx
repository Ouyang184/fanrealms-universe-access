
import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Users } from 'lucide-react';

export function FollowedCreators({ isCollapsed = false }) {
  const { subscriptions, loadingSubscriptions } = useSubscriptions();

  // Show only first 5 creators in sidebar
  const displayedCreators = subscriptions?.slice(0, 5) || [];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Users className="h-4 w-4 mr-2" />
        {!isCollapsed && "Followed Creators"}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {displayedCreators.map((subscription) => {
            const creator = subscription.creator;
            if (!creator?.users?.username) return null;
            
            return (
              <SidebarMenuItem key={subscription.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={isCollapsed ? creator.users.username : undefined}
                >
                  <Link
                    to={`/creator/${creator.users.username}`}
                    className={`w-full flex items-center py-2 ${
                      isCollapsed ? "px-2 justify-center" : "px-4 gap-3"
                    }`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={creator.users.profile_picture || undefined}
                        alt={creator.users.username}
                      />
                      <AvatarFallback>
                        {creator.users.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <span className="truncate">{creator.users.username}</span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          
          {subscriptions && subscriptions.length > 5 && !isCollapsed && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  to="/explore"
                  className="w-full text-sm text-muted-foreground hover:text-foreground px-4 py-2"
                >
                  View All Creators I Follow
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
