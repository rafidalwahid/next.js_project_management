"use client"

import { useSession } from "next-auth/react"
import { ReactNode } from "react"
import { UnifiedPermissionSystem } from "@/lib/permissions/unified-permission-system"

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that only renders its children if the user has the specified permission
 * Uses the unified permission system for consistent permission checking
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role || "guest"

  if (!UnifiedPermissionSystem.hasPermission(userRole, permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
