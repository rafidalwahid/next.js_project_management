"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import { useEffect, useState } from "react"
import { useProject } from "@/hooks/use-data"
import { useUserProfile } from "@/hooks/use-user-profile"

// Define route mappings for breadcrumb labels
const routeMappings: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  team: "Team",
  resources: "Resources",
  profile: "Profile",
  settings: "Settings",
  support: "Help & Support",
  kanban: "Kanban Board",
  new: "New",
  edit: "Edit",
  attendance: "Attendance",
  history: "History",
  reports: "Reports",
  statistics: "Statistics",
  settings: "Settings",
}

interface BreadcrumbItem {
  href: string
  label: string
  isLastSegment: boolean
  isDynamic?: boolean
  id?: string
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  // Memoize breadcrumb generation to avoid unnecessary re-renders
  useEffect(() => {
    // Skip breadcrumb generation for dashboard page
    if (pathname === '/dashboard') {
      setBreadcrumbs([])
      return
    }

    // Generate breadcrumbs only when pathname changes
    const generateBreadcrumbs = () => {
      const segments = pathname.split('/').filter(Boolean)

      if (segments.length === 0) {
        setBreadcrumbs([])
        return
      }

      const breadcrumbItems: BreadcrumbItem[] = []
      let currentPath = ''

      segments.forEach((segment, index) => {
        currentPath += `/${segment}`
        const isLastSegment = index === segments.length - 1

        breadcrumbItems.push({
          href: currentPath,
          label: routeMappings[segment] || segment,
          isLastSegment
        })
      })

      setBreadcrumbs(breadcrumbItems)
    }

    generateBreadcrumbs()
  }, [pathname])

  // Don't render anything if we're on the dashboard or have no breadcrumbs
  if (pathname === '/dashboard' || breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground overflow-x-auto mb-4">
      <Link
        href="/dashboard"
        className="overflow-hidden text-ellipsis whitespace-nowrap hover:text-foreground"
      >
        Dashboard
      </Link>
      <span className="mx-1">/</span>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.href}>
          {item.isLastSegment ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <>
              <Link
                href={item.href}
                className="overflow-hidden text-ellipsis whitespace-nowrap hover:text-foreground"
              >
                {item.label}
              </Link>
              <span className="mx-1">/</span>
            </>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
