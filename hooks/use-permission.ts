"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { PermissionSystem } from "@/lib/permissions/permission-system"

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permission: string) {
  const { data: session } = useSession()
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    // If no session, user doesn't have permission
    if (!session?.user?.id) {
      setHasPermission(false)
      return
    }

    // Use the permission system to check permission
    const userRole = session.user.role || "guest"
    const result = PermissionSystem.hasPermission(userRole, permission)
    setHasPermission(result)
  }, [session, permission])

  return hasPermission
}

/**
 * Hook to check if the current user has a specific role
 */
export function useRole(role: string) {
  const { data: session } = useSession()
  const [hasRole, setHasRole] = useState(false)

  useEffect(() => {
    // If no session, user doesn't have the role
    if (!session?.user?.id) {
      setHasRole(false)
      return
    }

    // Check if user has the role
    const userRole = session.user.role || "guest"
    setHasRole(userRole === role)
  }, [session, role])

  return hasRole
}

/**
 * Hook to get all permissions for the current user
 */
export function useUserPermissions() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If no session, user has no permissions
    if (!session?.user?.id) {
      setPermissions([])
      setIsLoading(false)
      return
    }

    // Get permissions based on user role
    const userRole = session.user.role || "guest"
    const rolePermissions = PermissionSystem.getPermissionsForRole(userRole)
    setPermissions(rolePermissions)
    setIsLoading(false)
  }, [session])

  return { permissions, isLoading }
}

/**
 * Hook to get the user's role
 */
export function useUserRole() {
  const { data: session } = useSession()
  const [role, setRole] = useState<string>("guest")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If no session, user is a guest
    if (!session?.user?.id) {
      setRole("guest")
      setIsLoading(false)
      return
    }

    // Get role from session
    const userRole = session.user.role || "guest"
    setRole(userRole)
    setIsLoading(false)
  }, [session])

  return { role, isLoading }
}
