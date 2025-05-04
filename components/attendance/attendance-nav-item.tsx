"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Clock, ChevronDown, ChevronRight, ClipboardCheck, BarChart2, Home, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface AttendanceNavItemProps {
  collapsed?: boolean
}

export function AttendanceNavItem({ collapsed = false }: AttendanceNavItemProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(pathname.startsWith("/attendance"))

  const { data: session } = useSession()
  const userRole = session?.user?.role || "user"

  const subItems = [
    {
      title: "Dashboard",
      href: "/attendance/dashboard",
      icon: Home,
      roles: ["user", "manager", "admin"],
    },
    {
      title: "History",
      href: "/attendance/history",
      icon: ClipboardCheck,
      roles: ["user", "manager", "admin"],
    },
    {
      title: "Statistics",
      href: "/attendance/statistics",
      icon: BarChart2,
      roles: ["user", "manager", "admin"],
    },
    {
      title: "Settings",
      href: "/attendance/settings",
      icon: Settings,
      roles: ["user", "manager", "admin"],
    },
    {
      title: "Admin",
      href: "/attendance/admin",
      icon: Users,
      roles: ["manager", "admin"],
    }
  ]

  // Filter items based on user role
  const filteredSubItems = subItems.filter(item =>
    item.roles.includes(userRole)
  )

  const isActive = pathname.startsWith("/attendance")

  if (collapsed) {
    return (
      <Link
        href="/attendance"
        className={cn(
          "group flex items-center justify-center rounded-md py-2 h-9 w-9 mx-auto px-0 text-xs font-medium transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
        title="Attendance"
      >
        <Clock className="h-5 w-5" />
      </Link>
    )
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between rounded-md py-2 px-2 text-xs font-medium transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          <span>Attendance</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2">
        <div className="flex flex-col gap-1 pt-1">
          {filteredSubItems.map((item) => {
            const Icon = item.icon
            const subItemActive = pathname === item.href || pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md py-1.5 px-2 text-xs transition-colors",
                  subItemActive
                    ? "bg-accent/50 text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 mr-2" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
