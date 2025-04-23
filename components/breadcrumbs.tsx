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
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground overflow-x-auto">
      <Link
        href="/dashboard"
        className="overflow-hidden text-ellipsis whitespace-nowrap hover:text-foreground"
      >
        Dashboard
      </Link>
      {/* Add more breadcrumb items as needed */}
    </nav>
  )
}
