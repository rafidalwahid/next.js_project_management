"use client"

import { useSession } from "next-auth/react"
import { ReactNode } from "react"
import { PermissionSystem } from "@/lib/permissions/permission-system"

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that only renders its children if the user has the specified permission
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role || "guest"

  if (!PermissionSystem.hasPermission(userRole, permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
