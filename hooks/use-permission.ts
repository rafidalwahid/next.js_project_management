"use client"

import { useSession } from "next-auth/react"
import { ClientPermissions } from "@/lib/client/permissions"
import { useState, useEffect } from "react"

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

    // Use the client-side method if we're still loading or for SSR
    const userRole = session.user.role || "guest"
    const clientResult = ClientPermissions.hasPermission(userRole, permission)
    setHasPermission(clientResult)

    // Then check the actual permission from the database
    const checkPermission = async () => {
      try {
        const result = await ClientPermissions.checkUserPermission(session.user.id, permission)
        setHasPermission(result)
      } catch (error) {
        console.error(`Error checking permission ${permission}:`, error)
      }
    }

    checkPermission()
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

    // Use the fallback method if we're still loading or for SSR
    const userRole = session.user.role || "guest"
    setHasRole(userRole === role)

    // Then check the actual roles from the database
    const checkRole = async () => {
      try {
        const roles = await ClientPermissions.getUserRoles(session.user.id)
        setHasRole(roles.includes(role))
      } catch (error) {
        console.error(`Error checking role ${role}:`, error)
      }
    }

    checkRole()
  }, [session, role])

  return hasRole
}

/**
 * Hook to get all permissions for the current user
 */
export function useUserPermissions() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    // If no session, user has no permissions
    if (!session?.user?.id) {
      setPermissions([])
      return
    }

    // Use the client-side method if we're still loading or for SSR
    const userRole = session.user.role || "guest"
    const clientPermissions = ClientPermissions.getPermissionsForRole(userRole)
    setPermissions(clientPermissions)

    // Then get the actual permissions from the database
    const getPermissions = async () => {
      try {
        const userPermissions = await ClientPermissions.getUserPermissions(session.user.id)
        setPermissions(userPermissions)
      } catch (error) {
        console.error("Error getting user permissions:", error)
      }
    }

    getPermissions()
  }, [session])

  return permissions
}

/**
 * Hook to get all roles for the current user
 */
export function useUserRoles() {
  const { data: session } = useSession()
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    // If no session, user has no roles
    if (!session?.user?.id) {
      setRoles([])
      return
    }

    // Use the fallback method if we're still loading or for SSR
    const userRole = session.user.role || "guest"
    setRoles([userRole])

    // Then get the actual roles from the database
    const getRoles = async () => {
      try {
        const userRoles = await ClientPermissions.getUserRoles(session.user.id)
        setRoles(userRoles)
      } catch (error) {
        console.error("Error getting user roles:", error)
      }
    }

    getRoles()
  }, [session])

  return roles
}
