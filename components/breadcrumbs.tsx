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
  profile: "Profile",
  settings: "Settings",
  kanban: "Kanban Board",
  new: "New",
  edit: "Edit",
  attendance: "Attendance",
  history: "History",
  reports: "Reports",
  statistics: "Statistics",
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

        // Check if segment is a UUID or ID (likely a dynamic route)
        const isDynamic = /^[a-f0-9]{8,}$/i.test(segment) || segment === '[id]'

        // Get a more readable label
        let label = routeMappings[segment] || segment

        // For dynamic segments, try to get a better label
        if (isDynamic) {
          // If it's a project ID, we could fetch the project title
          if (segments.includes('projects') && segments.indexOf('projects') < index) {
            label = 'Project Details'
          }
          // If it's a task ID
          else if (segments.includes('tasks') && segments.indexOf('tasks') < index) {
            label = 'Task Details'
          }
          // If it's a user profile
          else if (segments.includes('profile') && segments.indexOf('profile') < index) {
            label = 'User Profile'
          }
          else {
            label = 'Details'
          }
        }

        breadcrumbItems.push({
          href: currentPath,
          label: label,
          isLastSegment,
          isDynamic
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
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center">
              <Home className="h-3.5 w-3.5 mr-1" />
              <span>Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLastSegment ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
