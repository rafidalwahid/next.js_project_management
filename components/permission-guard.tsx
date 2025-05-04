"use client"

import { ReactNode } from "react"
import { PermissionService } from "@/lib/permissions/permission-service"
import { useAuthSession } from "@/hooks/use-auth-session"

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  showLoading?: boolean
  loadingComponent?: ReactNode
}

/**
 * Component that only renders its children if the user has the specified permission
 * Uses the permission service for consistent permission checking
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
  showLoading = false,
  loadingComponent = null
}: PermissionGuardProps) {
  const { session, status } = useAuthSession()
  const userRole = session?.user?.role || "guest"

  // Show loading state if requested and authentication is still loading
  if (showLoading && status === "loading") {
    return <>{loadingComponent || <div>Loading...</div>}</>
  }

  // Check permission using the permission service
  if (!PermissionService.hasPermission(userRole, permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
