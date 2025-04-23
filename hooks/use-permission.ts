"use client"

import { useSession } from "next-auth/react"
import { RolePermissionService } from "@/lib/services/role-permission-service"

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permission: string) {
  const { data: session } = useSession()
  const userRole = session?.user?.role || "guest"
  
  return RolePermissionService.hasPermission(userRole, permission)
}

/**
 * Hook to get all permissions for the current user
 */
export function useUserPermissions() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || "guest"
  
  return RolePermissionService.getPermissionsForRole(userRole)
}
