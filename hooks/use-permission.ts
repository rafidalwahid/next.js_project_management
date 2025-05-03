"use client"

import { useState, useEffect } from "react"
import { UnifiedPermissionSystem } from "@/lib/permissions/unified-permission-system"
import { useAuthSession } from "./use-auth-session"

/**
 * Hook to check if the current user has a specific permission
 * Uses the unified permission system for consistent permission checking
 */
export function usePermission(permission: string) {
  const { session } = useAuthSession()
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    // If no session, user doesn't have permission
    if (!session?.user?.id) {
      setHasPermission(false)
      return
    }

    // Use the unified permission system to check permission
    const userRole = session.user.role || "guest"
    const result = UnifiedPermissionSystem.hasPermission(userRole, permission)
    setHasPermission(result)
  }, [session, permission])

  return hasPermission
}

/**
 * Hook to check if the current user has a specific role
 */
export function useRole(role: string) {
  const { session } = useAuthSession()
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
 * Uses the unified permission system for consistent permission retrieval
 */
export function useUserPermissions() {
  const { session, status } = useAuthSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(status === 'loading')

    // If no session, user has no permissions
    if (!session?.user?.id) {
      setPermissions([])
      setIsLoading(false)
      return
    }

    // Get permissions based on user role using the unified permission system
    const userRole = session.user.role || "guest"
    const rolePermissions = UnifiedPermissionSystem.getPermissionsForRole(userRole)
    setPermissions(rolePermissions)
    setIsLoading(false)
  }, [session, status])

  return { permissions, isLoading }
}

/**
 * Hook to get the user's role
 * Provides the current user's role with loading state
 */
export function useUserRole() {
  const { session, status } = useAuthSession()
  const [role, setRole] = useState<string>("guest")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(status === 'loading')

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
  }, [session, status])

  return { role, isLoading }
}
