"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Users, ChevronDown, ChevronRight, UserCircle, UserPlus, UsersRound, ShieldCheck, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface TeamNavItemProps {
  collapsed?: boolean
}

export function TeamNavItem({ collapsed = false }: TeamNavItemProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(pathname.startsWith("/team") || pathname.startsWith("/profile"))
  const userId = session?.user?.id

  const subItems = [
    {
      title: "Team Members",
      href: "/team",
      icon: UsersRound,
      roles: ["user", "manager", "admin"], // All users can see team members
    },
    {
      title: "My Profile",
      href: userId ? `/profile/${userId}` : "/profile",
      icon: UserCircle,
      roles: ["user", "manager", "admin"], // All users can see their profile
    },
    {
      title: "Team Attendance",
      href: "/team/attendance",
      icon: ClipboardCheck,
      roles: ["manager", "admin"], // Only managers and admins can view team attendance
    },
    {
      title: "Add Member",
      href: "/team/new",
      icon: UserPlus,
      roles: ["manager", "admin"], // Only managers and admins can add members
    },
    {
      title: "Role Management",
      href: "/team/roles",
      icon: ShieldCheck,
      roles: ["admin"], // Only admins can manage roles
    },
    {
      title: "Permissions",
      href: "/team/permissions",
      icon: ShieldCheck,
      roles: ["admin"], // Only admins can manage permissions
    },
  ]

  // Filter items based on user role
  const userRole = session?.user?.role || "user"
  const filteredSubItems = subItems.filter(item =>
    item.roles.includes(userRole)
  )

  const isActive = pathname.startsWith("/team") || pathname.startsWith("/profile")

  if (collapsed) {
    return (
      <Link
        href="/team"
        className={cn(
          "group flex items-center justify-center rounded-md py-2 h-9 w-9 mx-auto px-0 text-xs font-medium transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
        title="Team"
      >
        <Users className="h-5 w-5" />
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
          <Users className="h-4 w-4 mr-2" />
          <span>Team</span>
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
