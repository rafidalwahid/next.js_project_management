"use client"

import { useState, useEffect } from "react"
import { ClientPermissionService } from "@/lib/permissions/client-permission-service"
import { useAuthSession } from "./use-auth-session"

/**
 * Hook to check if the current user has a specific permission
 * Uses both client-side and server-side permission checks for optimal performance
 */
export function usePermission(permission: string) {
  const { session } = useAuthSession()
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If no session, user doesn't have permission
    if (!session?.user?.id) {
      setHasPermission(false)
      setIsLoading(false)
      return
    }

    // Use the client permission service for a quick initial check
    const userRole = session.user.role || "guest"
    const quickResult = ClientPermissionService.hasPermission(userRole, permission)

    // If the quick check passes, we can return true immediately
    if (quickResult) {
      setHasPermission(true)
      setIsLoading(false)
      return
    }

    // If quick check fails, verify with the API
    // This handles the case where permissions might be in the database but not in the hardcoded matrix
    setIsLoading(true)

    fetch(`/api/users/check-permission?permission=${encodeURIComponent(permission)}`)
      .then(res => res.json())
      .then(data => {
        setHasPermission(data.hasPermission)
        setIsLoading(false)
      })
      .catch(err => {
        console.error("Error checking permission:", err)
        // Fall back to the client-side check on error
        setHasPermission(quickResult)
        setIsLoading(false)
      })
  }, [session, permission])

  return { hasPermission, isLoading }
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
 * Uses both client-side and server-side permission checks for optimal performance
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

    // Get initial permissions from client-side service for quick response
    const userRole = session.user.role || "guest"
    const quickPermissions = ClientPermissionService.getPermissionsForRole(userRole)

    // Set initial permissions
    setPermissions(quickPermissions)

    // Then fetch the complete list from the server
    fetch('/api/users/permissions')
      .then(res => res.json())
      .then(data => {
        if (data.permissions && Array.isArray(data.permissions)) {
          setPermissions(data.permissions)
        }
        setIsLoading(false)
      })
      .catch(err => {
        console.error("Error fetching permissions:", err)
        // Keep the client-side permissions on error
        setIsLoading(false)
      })
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
