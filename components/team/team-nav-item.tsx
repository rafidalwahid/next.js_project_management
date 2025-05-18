'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Users,
  ChevronDown,
  ChevronRight,
  UserCircle,
  UserPlus,
  UsersRound,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TeamNavItemProps {
  collapsed?: boolean;
}

export function TeamNavItem({ collapsed = false }: TeamNavItemProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(
    pathname.startsWith('/team') || pathname.startsWith('/profile')
  );
  const userId = session?.user?.id;
  const userRole = session?.user?.role || 'user';

  // Define menu items with their required permissions
  const subItems = [
    {
      title: 'Team Members',
      href: '/team/members',
      icon: UsersRound,
      permission: 'team_view',
      // This is a core functionality that all users should have access to
      alwaysShow: true,
    },
    {
      title: 'My Profile',
      href: userId ? `/profile/${userId}` : '/profile',
      icon: UserCircle,
      permission: 'edit_profile',
      // This is a core functionality that all users should have access to
      alwaysShow: true,
    },
    {
      title: 'Add Member',
      href: '/team/new',
      icon: UserPlus,
      permission: 'team_add',
      alwaysShow: false,
    },
    {
      title: 'Role Management',
      href: '/team/roles',
      icon: ShieldCheck,
      permission: 'manage_roles',
      alwaysShow: false,
    },
    {
      title: 'Permissions',
      href: '/team/permissions',
      icon: ShieldCheck,
      permission: 'manage_permissions',
      alwaysShow: false,
    },
  ];

  // Filter items based on user permissions
  const filteredSubItems = subItems.filter(item => {
    if (item.alwaysShow) return true;

    // Use the basic permissions for admin role directly
    const hasPermission =
      userRole === 'admin'
        ? true
        : userRole === 'manager'
          ? ['team_view', 'team_add', 'team_management', 'user_management'].includes(
              item.permission
            )
          : ['team_view'].includes(item.permission);

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`Permission check for ${item.title}: ${item.permission} = ${hasPermission}`);
    }

    // Always show these items for admin users regardless of permission check
    if (
      userRole === 'admin' &&
      ['Add Member', 'Role Management', 'Permissions'].includes(item.title)
    ) {
      return true;
    }

    return hasPermission;
  });

  const isActive = pathname.startsWith('/team') || pathname.startsWith('/profile');

  if (collapsed) {
    return (
      <Link
        href="/team"
        className={cn(
          'group flex items-center justify-center rounded-md py-2 h-9 w-9 mx-auto px-0 text-xs font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )}
        title="Team"
      >
        <Users className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between rounded-md py-2 px-2 text-xs font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )}
      >
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          <span>Team</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2">
        <div className="flex flex-col gap-1 pt-1">
          {filteredSubItems.map(item => {
            const Icon = item.icon;
            const subItemActive = pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md py-1.5 px-2 text-xs transition-colors',
                  subItemActive
                    ? 'bg-accent/50 text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5 mr-2" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
