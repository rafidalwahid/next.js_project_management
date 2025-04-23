"use client"

import { usePermission } from "@/hooks/use-permission"
import { ReactNode } from "react"

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that only renders its children if the user has the specified permission
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const hasPermission = usePermission(permission)
  
  if (!hasPermission) {
    return fallback
  }
  
  return <>{children}</>
}
