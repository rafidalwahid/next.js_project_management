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
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([])

  // Skip rendering breadcrumbs on the home page and auth pages
  if (pathname === "/" ||
      !pathname ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname?.startsWith("/reset-password")) {
    return null
  }

  // Split the pathname into segments
  const segments = pathname.split("/").filter(Boolean)

  // If there are no segments, don't render breadcrumbs
  if (segments.length === 0) {
    return null
  }

  // Check if we have a project ID or user ID in the path
  const projectIdMatch = pathname.match(/\/projects\/([^\/]+)(?:\/|$)/)
  const projectId = projectIdMatch ? projectIdMatch[1] : null
  const projectIdForHook = projectId && projectId !== 'new' && projectId !== 'edit' ? projectId : null
  const { project } = useProject(projectIdForHook)

  // Check for user profile
  const userIdMatch = pathname.match(/\/profile\/([^\/]+)(?:\/|$)/)
  const userId = userIdMatch ? userIdMatch[1] : null
  // Only fetch profile if userId is not null and not a UUID-like string
  const userIdForHook = userId && userId !== 'undefined' ? userId : ''
  const { profile } = useUserProfile(userIdForHook)

  // Generate breadcrumb items
  useEffect(() => {

    const generateBreadcrumbItems = async () => {
      try {
        const items = await Promise.all(
          segments.map(async (segment, index) => {
          // Build the href for this breadcrumb item
          const href = `/${segments.slice(0, index + 1).join("/")}`

          // Check if this is a dynamic segment
          // Match digits, UUIDs, or special keywords
          const isDynamic = segment === 'new' ||
                          segment === 'edit' ||
                          /^\d/.test(segment) ||
                          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

          // Get the label for this segment
          let label = routeMappings[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

          // Handle special cases for dynamic segments
          if (isDynamic) {
            // For project detail pages
            if (segments[0] === 'projects' && index === 1) {
              if (segment === 'new') {
                label = 'New Project'
              } else if (segment === 'edit') {
                label = 'Edit Project'
              } else if (project) {
                label = project.title || 'Project Details'
              } else {
                // If we don't have project data yet, use a generic label
                label = 'Project Details'

                // If the segment is a UUID, make sure we have a readable label
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
                  label = 'Project Details'
                }
              }
            }
            // For user profile pages
            else if (segments[0] === 'profile' && index === 1) {
              // If we have profile data, use the name, otherwise use a generic label
              label = profile?.name || 'User Profile'

              // If the segment is a UUID, make sure we have a readable label
              if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
                label = 'User Profile'
              }
            }
            // For task detail pages
            else if (segments[0] === 'tasks' && index === 1) {
              if (segment === 'new') {
                label = 'New Task'
              } else if (segment === 'edit') {
                label = 'Edit Task'
              } else {
                label = 'Task Details'

                // If the segment is a UUID, make sure we have a readable label
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
                  label = 'Task Details'
                }
              }
            }
          }

          // Check if this is the last segment (current page)
          const isLastSegment = index === segments.length - 1

          return {
            href,
            label,
            isLastSegment,
            isDynamic,
            id: isDynamic ? segment : undefined,
          }
        })
      )

      setBreadcrumbItems(items)
      } catch (error) {
        console.error('Error generating breadcrumbs:', error)
        // Set a simple fallback breadcrumb
        setBreadcrumbItems([
          {
            href: pathname,
            label: 'Current Page',
            isLastSegment: true,
          }
        ])
      }
    }

    generateBreadcrumbItems()
  }, [pathname, project, profile])

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItem>
              {item.isLastSegment ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLastSegment && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
