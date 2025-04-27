"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Users,
  UserCircle,
  Clock
}
from "lucide-react"
import { AttendanceNavItem } from "@/components/attendance/attendance-nav-item"
import { TeamNavItem } from "@/components/team/team-nav-item"

function getNavItems(userId?: string) {
  return [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Projects",
      href: "/projects",
      icon: Briefcase,
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
    },
    {
      title: "Team",
      href: "/team",
      icon: Users,
      isExpandable: true,
    },
    {
      title: "Attendance",
      href: "/attendance",
      icon: Clock,
      isExpandable: true,
    },
  ];
}

interface DashboardNavProps {
  collapsed?: boolean
}

export function DashboardNav({ collapsed = false }: DashboardNavProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const navItems = getNavItems(userId)

  return (
    <nav className={cn(
      "flex flex-col gap-1",
      collapsed ? "px-2" : "px-3"
    )}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        if (item.title === "Attendance") {
          return <AttendanceNavItem key={item.href} collapsed={collapsed} />
        }

        if (item.title === "Team") {
          return <TeamNavItem key={item.href} collapsed={collapsed} />
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md py-2 text-xs font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              collapsed
                ? "justify-center h-9 w-9 mx-auto px-0"
                : "px-2"
            )}
            title={collapsed ? item.title : undefined}
          >
            <Icon
              className={cn(
                "flex-shrink-0",
                collapsed ? "h-5 w-5" : "h-4 w-4 mr-2"
              )}
            />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
